import { WebSocket } from 'ws';
import GameError from '../../../errors/GameError.js';
import MatchError from '../../../errors/MatchError.js';
import {
  type MatchDetails,
  type PlayerMove,
  type UpdateAll,
  type UpdateEnemy,
  validateEndMatch,
  validateErrorMatch,
  validateGameMesssageInput,
  validatePlayerMove,
  validatePlayerState,
} from '../../../schemas/zod.js';
import { logger, redis } from '../../../server.js';
import Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import type Player from '../characters/players/Player.js';

class GameServiceImpl implements GameService {
  private readonly matches: Map<string, Match>;
  private readonly connections: Map<string, WebSocket>;
  private static instance: GameServiceImpl;

  public static getInstance(): GameServiceImpl {
    if (!GameServiceImpl.instance) GameServiceImpl.instance = new GameServiceImpl();
    return GameServiceImpl.instance;
  }

  private constructor() {
    this.matches = new Map<string, Match>();
    this.connections = new Map();
  }
  getMatchUpdate(matchId: string): UpdateAll {
    const match = this.getMatch(matchId);
    if (!match) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    return match.getMatchUpdate();
  }
  checkMatchDetails(matchDetails: MatchDetails): void {
    if (matchDetails.host === matchDetails.guest) throw new GameError(GameError.MATCH_CANNOT_START);
    if (!matchDetails.host || !matchDetails.guest)
      throw new GameError(GameError.MATCH_CANNOT_START);
    if (!matchDetails.started) throw new GameError(GameError.MATCH_CANNOT_START);
  }
  getMatch(matchId: string): Match | undefined {
    if (!this.matches.has(matchId)) return undefined;
    return this.matches.get(matchId);
  }
  public removeConnection(user: string): void {
    this.connections.delete(user);
  }

  public async handleGameMessage(userId: string, matchId: string, message: Buffer): Promise<void> {
    const { type, payload, player, socketP1, socketP2 } = this.validateMessage(
      userId,
      matchId,
      message
    );
    const gameMatch = this.matches.get(matchId);
    if (!player.isAlive())
      return socketP1.send(
        this.parseToString(validatePlayerState({ id: player.getId(), state: 'dead' }))
      );
    if (gameMatch?.checkWin())
      return this.notifyPlayers(socketP1, socketP2, validateEndMatch({ result: 'win' }));
    if (gameMatch?.checkLose())
      return this.notifyPlayers(socketP1, socketP2, validateEndMatch({ result: 'lose' }));

    switch (type) {
      case 'movement':
        try {
          // Tries to move the player || Throws an error if the move is invalid
          const playerUpdate = await this.movePlayer(player, payload);
          this.notifyPlayers(socketP1, socketP2, playerUpdate);
        } catch (error) {
          socketP1.send(this.parseToString(validateErrorMatch({ error: 'Invalid move' })));
          logger.warn(`An error occurred while trying to move player ${userId} ${payload}`);
          logger.error(error);
        }
        break;
      case 'rotate': {
        const rotatedPlayer = this.rotatePlayer(player, payload);
        this.notifyPlayers(socketP1, socketP2, validatePlayerMove(rotatedPlayer));
        break;
      }
      case 'attack':
        // Handle attack - TODO Implement attack --> Priority 2 <--- NOT MVP
        break;
      case 'set-color':
        player.setColor(payload);
        await redis.hset(`users:${userId}`, 'color', payload);
        this.notifyPlayers(
          socketP1,
          socketP2,
          validatePlayerState({ id: player.getId(), state: 'alive', color: payload })
        );
        break;
      default:
        throw new MatchError(MatchError.INVALID_MESSAGE_TYPE);
    }

    if (gameMatch?.checkWin())
      return this.notifyPlayers(socketP1, socketP2, validateEndMatch({ result: 'win' }));
    if (gameMatch?.checkLose())
      return this.notifyPlayers(socketP1, socketP2, validateEndMatch({ result: 'lose' }));
  }

  public registerConnection(user: string, socket: WebSocket): boolean {
    const existingSocket = this.connections.has(user);
    this.connections.set(user, socket);
    return existingSocket;
  }
  public createMatch(matchDetails: MatchDetails): Match {
    if (!matchDetails.guest) throw new MatchError(MatchError.MATCH_CANNOT_BE_CREATED);
    const gameMatch = new Match(
      matchDetails.id,
      matchDetails.level,
      matchDetails.map,
      matchDetails.host,
      matchDetails.guest
    );
    this.matches.set(matchDetails.id, gameMatch);
    // Update users with match id
    redis.hset(`users:${matchDetails.host}`, 'match', matchDetails.id);
    redis.hset(`users:${matchDetails.guest}`, 'match', matchDetails.id);
    return gameMatch;
  }
  public async startMatch(matchId: string): Promise<void> {
    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    await gameMatch.startGame();
    return;
  }
  public async extendUsersSession(userId: string): Promise<void> {
    await redis.expire(`users:${userId}`, 20 * 60); // 20 minutes
  }
  public async extendMatchSession(matchId: string): Promise<void> {
    await redis.expire(`matches:${matchId}`, 20 * 60); // 20 minutes
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
    socketP2: WebSocket;
  } {
    const { type, payload } = validateGameMesssageInput(JSON.parse(message.toString()));

    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND); // Not found in the matches map
    const socketP1 = this.connections.get(userId);
    const otherPlayeId =
      gameMatch.getHost() === userId ? gameMatch.getGuest() : gameMatch.getHost();
    const socketP2 = this.connections.get(otherPlayeId);
    if (!socketP1) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the socketP1 connections
    if (!socketP2) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the socketP2 connections
    this.validateConnections(socketP1, socketP2); // Check the sockets are open
    const player = gameMatch.getPlayer(userId);
    if (!player) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the match asocieated with the matchId

    return { type, payload, gameMatch, player, socketP1, socketP2 };
  }

  private validateConnections(socketP1: WebSocket, socketP2: WebSocket): void {
    if (socketP1.readyState !== WebSocket.OPEN || socketP2.readyState !== WebSocket.OPEN) {
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

  private notifyPlayers(socketP1: WebSocket, socketP2: WebSocket, dataDTO: unknown): void {
    socketP1.send(this.parseToString(dataDTO));
    socketP2.send(this.parseToString(dataDTO));
  }

  private parseToString(data: unknown): string {
    return JSON.stringify(data);
  }
}
export default GameServiceImpl;
