import { WebSocket } from 'ws';
import GameError from '../../../errors/GameError.js';
import MatchError from '../../../errors/MatchError.js';
import type MatchRepository from '../../../schemas/MatchRepository.js';
import type UserRepository from '../../../schemas/UserRepository.js';
import {
  type GameMessageOutput,
  type MatchDetails,
  type PlayerMove,
  type UpdateAll,
  type UpdateEnemy,
  type UpdateTime,
  validateEndMatch,
  validateErrorMatch,
  validateGameMesssageInput,
  validatePlayerState,
} from '../../../schemas/zod.js';
import { logger } from '../../../server.js';
import Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import type Player from '../characters/players/Player.js';
/**
 * @class GameServiceImpl
 * Class that implements the GameService interface
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
class GameServiceImpl implements GameService {
  private readonly userRepository: UserRepository;
  private readonly matchRepository: MatchRepository;
  private readonly matches: Map<string, Match>;
  private readonly connections: Map<string, WebSocket>;

  /**
   * Updates the time of a match and notifies the players.
   *
   * @param {string} matchId The ID of the match to notify the time update.
   * @param {UpdateTime} time The time to notify.
   * @return {Promise<void>} A promise that resolves when the time is updated.
   */
  public async updateTimeMatch(matchId: string, time: UpdateTime): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    const socketP1 = this.connections.get(match.getHost());
    const socketP2 = this.connections.get(match.getGuest());
    this.notifyPlayers(socketP1, socketP2, { type: 'update-time', payload: time });
    if (match.checkWin())
      return this.notifyPlayers(socketP1, socketP2, {
        type: 'end',
        payload: validateEndMatch({ result: 'win' }),
      });
    if (match.checkLose())
      return this.notifyPlayers(socketP1, socketP2, {
        type: 'end',
        payload: validateEndMatch({ result: 'lose' }),
      });
  }

  constructor(matchRepository: MatchRepository, userRepository: UserRepository) {
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.matches = new Map<string, Match>();
    this.connections = new Map();
  }

  /**
   * Retrieves the match update for the given match ID.
   *
   * @param {string} matchId The ID of the match to get the update.
   * @return {UpdateAll} The match update.
   */
  public getMatchUpdate(matchId: string): UpdateAll {
    const match = this.getMatch(matchId);
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    return match.getMatchUpdate();
  }

  /**
   * Validates the match details.
   *
   * @param {MatchDetails} matchDetails The match details to validate.
   * @throws {GameError} If the match details are invalid.
   */
  public checkMatchDetails(matchDetails: MatchDetails): void {
    if (matchDetails.host === matchDetails.guest) throw new GameError(GameError.MATCH_CANNOT_START);
    if (!matchDetails.host || !matchDetails.guest)
      throw new GameError(GameError.MATCH_CANNOT_START);
    if (!matchDetails.started) throw new GameError(GameError.MATCH_CANNOT_START);
  }

  /**
   * Retrieves the match for the given match ID.
   *
   * @param {string} matchId The ID of the match to retrieve.
   * @return {Match | undefined} The match if it exists, undefined otherwise.
   */
  public getMatch(matchId: string): Match | undefined {
    if (!this.matches.has(matchId)) return undefined;
    return this.matches.get(matchId);
  }

  /**
   * Removes the connection for the given user ID.
   *
   * @param {string} user The ID of the user to remove the connection for.
   */
  public removeConnection(user: string): void {
    this.connections.delete(user);
  }

  /**
   * Handles a game message from a user.
   *
   * @param {string} userId The ID of the user that sent the message.
   * @param {string} matchId The ID of the match the user is playing.
   * @param {Buffer} message The message sent by the user.
   * @throws {MatchError} If the message is invalid.
   * @throws {GameError} If the match or player is not found.
   */
  public async handleGameMessage(userId: string, matchId: string, message: Buffer): Promise<void> {
    const { type, payload, player, socketP1, socketP2 } = this.validateMessage(
      userId,
      matchId,
      message
    );
    const gameMatch = this.matches.get(matchId);
    if (await this.gameFinished(gameMatch, socketP1, socketP2)) return;
    if (!player.isAlive())
      return socketP1.send(
        this.parseToString({
          type: 'update-state',
          payload: validatePlayerState({ id: player.getId(), state: 'dead' }),
        })
      );

    switch (type) {
      case 'movement':
        try {
          const playerUpdate = await this.movePlayer(player, payload);
          this.notifyPlayers(socketP1, socketP2, { type: 'update-move', payload: playerUpdate });
        } catch (error) {
          socketP1.send(
            this.parseToString({
              type: 'error',
              payload: validateErrorMatch({ error: 'Invalid move' }),
            })
          );
          logger.warn(`An error occurred while trying to move player ${userId} ${payload}`);
          logger.error(error);
        }
        break;
      case 'rotate': {
        const rotatedPlayer = this.rotatePlayer(player, payload);
        this.notifyPlayers(socketP1, socketP2, { type: 'update-move', payload: rotatedPlayer });
        break;
      }
      case 'exec-power':
        // Handle attack - TODO Implement attack --> Priority 2 <--- NOT MVP
        break;
      case 'set-color':
        player.setColor(payload);
        await this.userRepository.updateUser(userId, { color: payload });
        this.notifyPlayers(socketP1, socketP2, {
          type: 'update-state',
          payload: validatePlayerState({ id: player.getId(), state: 'alive', color: payload }),
        });
        break;
      default:
        throw new MatchError(MatchError.INVALID_MESSAGE_TYPE);
    }

    if (await this.gameFinished(gameMatch, socketP1, socketP2)) return;
  }

  /**
   * Updates the players in the match with the given data.
   *
   * @param {string} matchId The ID of the match to update.
   * @param {string} hostId The ID of the host player.
   * @param {string} guestId The ID of the guest player.
   * @param {GameMessageOutput} data The data to update the players with.
   * @return {Promise<void>} A promise that resolves when the players are updated.
   */
  public async updatePlayers(
    matchId: string,
    hostId: string,
    guestId: string,
    data: GameMessageOutput
  ): Promise<void> {
    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    const socketP1 = this.connections.get(hostId);
    const socketP2 = this.connections.get(guestId);
    if (socketP1 && socketP1.readyState === WebSocket.OPEN) socketP1.send(this.parseToString(data));
    if (socketP2 && socketP2.readyState === WebSocket.OPEN) socketP2.send(this.parseToString(data));
    await this.gameFinished(gameMatch, socketP1, socketP2);
  }

  /**
   * Registers a connection for a user.
   *
   * @param {string} user The ID of the user to register.
   * @param {WebSocket} socket The WebSocket connection of the user.
   * @return {boolean} True if the user was already connected, false otherwise.
   */
  public registerConnection(user: string, socket: WebSocket): boolean {
    const existingSocket = this.connections.has(user);
    this.connections.set(user, socket);
    return existingSocket;
  }

  /**
   * Creates a match with the given details.
   *
   * @param {MatchDetails} matchDetails The details of the match to create.
   * @return {Promise<Match>} A promise that resolves to the created match.
   */
  public async createMatch(matchDetails: MatchDetails): Promise<Match> {
    if (!matchDetails.guest) throw new MatchError(MatchError.MATCH_CANNOT_BE_CREATED);
    const gameMatch = new Match(
      this,
      matchDetails.id,
      matchDetails.level,
      matchDetails.map,
      matchDetails.host,
      matchDetails.guest
    );
    await gameMatch.initialize();
    this.matches.set(matchDetails.id, gameMatch);
    await this.userRepository.updateUser(matchDetails.host, { matchId: matchDetails.id });
    await this.userRepository.updateUser(matchDetails.guest, { matchId: matchDetails.id });
    return gameMatch;
  }

  /**
   * Starts a match with the given ID.
   *
   * @param {string} matchId The ID of the match to start.
   * @return {Promise<void>} A promise that resolves when the match starts.
   */
  public async startMatch(matchId: string): Promise<void> {
    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    await gameMatch.startGame();
  }

  /**
   * Extends the session of a user.
   *
   * @param {string} userId The ID of the user to extend the session for.
   * @return {Promise<void>} A promise that resolves when the session is extended.
   */
  public async extendUsersSession(userId: string): Promise<void> {
    await this.userRepository.extendSession(userId, 20);
  }

  /**
   * Extends the session of a match.
   *
   * @param {string} matchId The ID of the match to extend the session for.
   * @return {Promise<void>} A promise that resolves when the session is extended.
   */
  public async extendMatchSession(matchId: string): Promise<void> {
    await this.matchRepository.extendSession(matchId, 20);
  }

  private async gameFinished(
    gameMatch: Match | undefined,
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined
  ): Promise<boolean> {
    if (gameMatch && !gameMatch.isRunning()) return true;
    if (gameMatch?.checkWin()) {
      this.notifyPlayers(socketP1, socketP2, {
        type: 'end',
        payload: validateEndMatch({ result: 'win' }),
      });
      await gameMatch.stopGame();
      await this.removeMatch(gameMatch, socketP1, socketP2);
      return true;
    }
    if (gameMatch?.checkLose()) {
      this.notifyPlayers(socketP1, socketP2, {
        type: 'end',
        payload: validateEndMatch({ result: 'lose' }),
      });
      await gameMatch.stopGame();
      await this.removeMatch(gameMatch, socketP1, socketP2);
      return true;
    }
    return false;
  }

  private async removeMatch(
    gameMatch: Match | undefined,
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined
  ): Promise<void> {
    this.notifyPlayers(socketP1, socketP2, {
      type: 'end',
      payload: validateEndMatch({ result: 'end game' }),
    });
    socketP1?.close();
    socketP2?.close();
    if (!gameMatch) return;
    this.matches.delete(gameMatch.getId());
    this.removeConnection(gameMatch.getHost());
    this.removeConnection(gameMatch.getGuest());
    await this.userRepository.updateUser(gameMatch.getHost(), { matchId: null, role: 'HOST' });
    await this.userRepository.updateUser(gameMatch.getGuest(), { matchId: null, role: 'HOST' });
    this.matchRepository.removeMatch(gameMatch.getId());
    return;
  }

  private validateMessage(
    userId: string,
    matchId: string,
    message: Buffer
  ): {
    type: string;
    payload: string;
    gameMatch: Match;
    player: Player;
    socketP1: WebSocket;
    socketP2: WebSocket | undefined;
  } {
    const { type, payload } = validateGameMesssageInput(JSON.parse(message.toString()));

    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND); // Not found in the matches map
    const socketP1 = this.connections.get(userId);
    const otherPlayeId =
      gameMatch.getHost() === userId ? gameMatch.getGuest() : gameMatch.getHost();
    const socketP2 = this.connections.get(otherPlayeId);
    if (!socketP1) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the socketP1 connections
    this.validateConnections(socketP1); // Check the sockets are open
    const player = gameMatch.getPlayer(userId);
    if (!player) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the match asocieated with the matchId

    return { type, payload, gameMatch, player, socketP1, socketP2 };
  }

  private validateConnections(socketP1: WebSocket): void {
    if (socketP1.readyState !== WebSocket.OPEN) {
      throw new MatchError(MatchError.SOCKET_CLOSED);
    }
  }

  private async movePlayer(player: Player, direction: string): Promise<PlayerMove | UpdateEnemy> {
    switch (direction) {
      case 'up':
        return await player.moveUp();

      case 'down':
        return await player.moveDown();

      case 'left':
        return await player.moveLeft();

      case 'right':
        return await player.moveRight();

      default:
        throw new MatchError(MatchError.INVALID_MOVE);
    }
  }

  private rotatePlayer(player: Player, direction: string): PlayerMove | UpdateEnemy {
    switch (direction) {
      case 'up':
        return player.changeOrientation('up');
      case 'down':
        return player.changeOrientation('down');
      case 'left':
        return player.changeOrientation('left');
      case 'right':
        return player.changeOrientation('right');
      default:
        throw new MatchError(MatchError.INVALID_ROTATION);
    }
  }

  private notifyPlayers(
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined,
    dataDTO: GameMessageOutput
  ): void {
    if (socketP1 && socketP1.readyState === WebSocket.OPEN)
      socketP1.send(this.parseToString(dataDTO));
    if (socketP2 && socketP2.readyState === WebSocket.OPEN)
      socketP2.send(this.parseToString(dataDTO));
  }

  private parseToString(data: GameMessageOutput): string {
    return JSON.stringify(data);
  }
}
export default GameServiceImpl;
