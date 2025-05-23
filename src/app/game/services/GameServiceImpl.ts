import { WebSocket } from 'ws';
import GameError from '../../../errors/GameError.js';
import MatchError from '../../../errors/MatchError.js';
import type MatchRepository from '../../../schemas/MatchRepository.js';
import type UserRepository from '../../../schemas/UserRepository.js';
import type GameCache from '../../../schemas/repositories/GameCache.js';
import {
  type GameMessageOutput,
  type MatchDetails,
  type MatchStorage,
  type PlayerMove,
  type UpdateAll,
  type UpdateEnemy,
  type UpdateTime,
  validateEndMatch,
  validateErrorMatch,
  validateGameMessageOutput,
  validateGameMesssageInput,
  validatePlayerState,
} from '../../../schemas/zod.js';
import { config, logger } from '../../../server.js';
import Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import type SocketConnectionsService from '../../shared/SocketConnectionService.js';
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
  private readonly connections: SocketConnectionsService;
  private readonly gameCache: GameCache;

  /**
   * Updates the time of a match and notifies the players.
   *
   * @param {string} matchId The ID of the match to notify the time update.
   * @param {UpdateTime} time The time to notify.
   * @return {Promise<void>} A promise that resolves when the time is updated.
   */
  public async updateTimeMatch(matchId: string, time: UpdateTime): Promise<void> {
    const match = await this.getMatch(matchId);
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    const socketP1 = this.connections.getConnection(match.getHost());
    const socketP2 = this.connections.getConnection(match.getGuest());
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

  constructor(
    matchRepository: MatchRepository,
    userRepository: UserRepository,
    gameCache: GameCache,
    connections: SocketConnectionsService
  ) {
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.matches = new Map<string, Match>();
    this.connections = connections;
    this.gameCache = gameCache;
  }
  public async saveMatch(matchId: string, matchStorage: MatchStorage): Promise<void> {
    return await this.gameCache.saveMatch(matchId, matchStorage);
  }
  public async getMatchStorage(matchId: string): Promise<MatchStorage | null> {
    return await this.gameCache.getMatch(matchId);
  }

  /**
   * Retrieves the match update for the given match ID.
   *
   * @param {string} matchId The ID of the match to get the update.
   * @return {UpdateAll} The match update.
   */
  public async getMatchUpdate(matchId: string): Promise<UpdateAll> {
    const match = await this.getMatch(matchId);
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    return match.getMatchUpdate();
  }

  private async restoreMatch(matchStorage: MatchStorage): Promise<Match> {
    const match = new Match(
      this,
      matchStorage.id,
      matchStorage.level,
      matchStorage.map,
      matchStorage.host.id,
      matchStorage.guest.id,
      matchStorage.paused,
      matchStorage.fruitGenerated,
      matchStorage.timeSeconds
    );
    match.loadBoard(matchStorage.board, matchStorage.host, matchStorage.guest);
    await match.startGame();
    return match;
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
  public async getMatch(matchId: string): Promise<Match | undefined> {
    if (!this.matches.has(matchId)) {
      const matchStorage = await this.getMatchStorage(matchId);
      logger.debug(
        `Match ${matchId}  found in memory, trying to restore from cache: ${JSON.stringify(matchStorage)}`
      );
      if (!matchStorage) return undefined;
      try {
        const match = await this.restoreMatch(matchStorage);
        this.matches.set(matchId, match);
      } catch (error) {
        logger.warn(`Error restoring match ${matchId}`);
        logger.error(error);
        return undefined;
      }
    }
    return this.matches.get(matchId);
  }

  /**
   * Removes the connection for the given user ID.
   *
   * @param {string} user The ID of the user to remove the connection for.
   */
  public removeConnection(user: string): void {
    this.connections.removeConnection(user);
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
    const { type, payload, player, gameMatch, socketP1, socketP2 } = await this.validateMessage(
      userId,
      matchId,
      message
    );
    if (await this.gameFinished(gameMatch, socketP1, socketP2)) return;
    if (await this.isPaused(socketP1, socketP2, gameMatch, type)) return;
    if (this.playerDead(player, socketP1)) return;

    switch (type) {
      case 'movement': {
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
      }
      case 'pause': {
        await gameMatch.pauseMatch();
        this.notifyPlayers(
          socketP1,
          socketP2,
          validateGameMessageOutput({ type: 'paused', payload: true })
        );
        break;
      }
      case 'resume': {
        await gameMatch.resumeMatch();
        this.notifyPlayers(
          socketP1,
          socketP2,
          validateGameMessageOutput({ type: 'paused', payload: false })
        );
        break;
      }
      case 'rotate': {
        const rotatedPlayer = this.rotatePlayer(player, payload);
        this.notifyPlayers(
          socketP1,
          socketP2,
          validateGameMessageOutput({ type: 'update-move', payload: rotatedPlayer })
        );
        break;
      }
      case 'exec-power': {
        const frozenCells = await player.execPower();
        const playerDirection = player.getOrientation();
        const messageFrozens = validateGameMessageOutput({
          type: 'update-frozen-cells',
          payload: { cells: frozenCells, direction: playerDirection },
        });
        this.notifyPlayers(socketP1, socketP2, messageFrozens);
        break;
      }
      case 'set-color': {
        player.setColor(payload);
        await this.userRepository.updateUser(userId, { color: payload });
        gameMatch.updatePlayer(player.getId(), { color: payload });
        this.notifyPlayers(socketP1, socketP2, {
          type: 'update-state',
          payload: validatePlayerState({ id: player.getId(), state: 'alive', color: payload }),
        });
        break;
      }
      case 'update-all': {
        const updateAll = gameMatch.getMatchUpdate();
        this.notifyPlayers(socketP1, socketP2, {
          type: 'update-all',
          payload: updateAll,
        });
        break;
      }
      default: {
        throw new MatchError(MatchError.INVALID_MESSAGE_TYPE);
      }
    }
    gameMatch
      ?.getMatchStorage()
      .then((matchStorage) => {
        if (matchStorage) {
          this.gameCache.saveMatch(matchId, matchStorage);
        }
      })
      .catch((error) => {
        logger.warn(`Error trying to save match ${matchId} in cache`);
        logger.error(error);
      });

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
    const gameMatch = await this.getMatch(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    const socketP1 = this.connections.getConnection(hostId);
    const socketP2 = this.connections.getConnection(guestId);
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
    const existingSocket = this.connections.isConnected(user);
    this.connections.registerConnection(user, socket);
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
    gameMatch.initialize();
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
    const gameMatch = await this.getMatch(matchId);
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
    gameMatch: Match,
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined
  ): Promise<boolean> {
    if (!gameMatch.isRunning()) return true;
    if (gameMatch.checkWin() || gameMatch.checkLose()) {
      const result = gameMatch.checkWin() ? 'win' : 'lose';
      this.notifyEndGame(socketP1, socketP2, result);
      await gameMatch.stopGame();
      await this.matchRepository.updateMatch(gameMatch.getId(), { started: false });
      if (result === 'win') {
        await this.matchRepository.updateMatch(gameMatch.getId(), {
          level: gameMatch.getLevel() + 1,
        });
      }
      await this.endSession(gameMatch, socketP1, socketP2);
      this.matches.delete(gameMatch.getId());
      await this.gameCache.removeMatch(gameMatch.getId());
      this.removeMatchAfterDelay(gameMatch.getId(), config.MATCH_TIME_OUT_SECONDS);
      return true;
    }
    return false;
  }

  private removeMatchAfterDelay(matchId: string, timeSeconds: number): void {
    setTimeout(async () => {
      try {
        const match = await this.matchRepository.getMatchById(matchId);
        if (match.started) return;
        await this.removeMatch(match);

        const socketP1 = this.connections.getConnection(match.host);
        const socketP2 = match.guest ? this.connections.getConnection(match.guest) : undefined;
        this.notifyPlayers(
          socketP1,
          socketP2,
          validateGameMessageOutput({
            type: 'timeout',
            payload: { message: 'Match timed out, return to lobby...' },
          })
        );
      } catch (error) {
        logger.warn(`Error trying to remove match ${matchId}`);
        logger.error(error);
      }
    }, timeSeconds * 1000);
  }

  private notifyEndGame(
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined,
    result: string
  ): void {
    this.notifyPlayers(socketP1, socketP2, {
      type: 'end',
      payload: validateEndMatch({ result }),
    });
  }

  private async endSession(
    gameMatch: Match,
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined
  ): Promise<void> {
    this.notifyPlayers(socketP1, socketP2, {
      type: 'end',
      payload: validateEndMatch({ result: 'end game' }),
    });
    socketP1?.close();
    socketP2?.close();
    this.removeConnection(gameMatch.getHost());
    this.removeConnection(gameMatch.getGuest());
  }

  private async removeMatch(gameMatch: MatchDetails): Promise<void> {
    if (!gameMatch.guest) throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    await this.userRepository.updateUser(gameMatch.host, { matchId: null, role: 'HOST' });
    await this.userRepository.updateUser(gameMatch.guest, { matchId: null, role: 'HOST' });
    await this.matchRepository.removeMatch(gameMatch.id);
  }

  private async validateMessage(
    userId: string,
    matchId: string,
    message: Buffer
  ): Promise<{
    type: string;
    payload: string;
    gameMatch: Match;
    player: Player;
    socketP1: WebSocket;
    socketP2: WebSocket | undefined;
  }> {
    const { type, payload } = validateGameMesssageInput(JSON.parse(message.toString()));

    const gameMatch = await this.getMatch(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND); // Not found in the matches map
    const socketP1 = this.connections.getConnection(userId);
    const otherPlayeId =
      gameMatch.getHost() === userId ? gameMatch.getGuest() : gameMatch.getHost();
    const socketP2 = this.connections.getConnection(otherPlayeId);
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

  public notifyPlayers(
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

  private async isPaused(
    socketP1: WebSocket | undefined,
    socketP2: WebSocket | undefined,
    gameMatch: Match,
    type: string
  ): Promise<boolean> {
    const paused = (await gameMatch.isPaused()) && type !== 'resume';
    if (paused)
      this.notifyPlayers(
        socketP1,
        socketP2,
        validateGameMessageOutput({ type: 'paused', payload: true })
      );
    return paused;
  }

  private playerDead(player: Player, socketP1: WebSocket): boolean {
    const alive = player.isAlive();
    if (!alive)
      socketP1.send(
        this.parseToString({
          type: 'update-state',
          payload: validatePlayerState({ id: player.getId(), state: 'dead' }),
        })
      );
    return !alive;
  }
}
export default GameServiceImpl;
