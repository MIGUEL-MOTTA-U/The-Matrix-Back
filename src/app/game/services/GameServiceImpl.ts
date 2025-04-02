import type { WebSocket } from 'ws';
import MatchError from '../../../errors/MatchError.js';
import { type MatchDetails, validateGameMessage } from '../../../schemas/zod.js';
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
  getMatch(matchId: string): Match | undefined {
    if (!this.matches.has(matchId)) return undefined;
    return this.matches.get(matchId);
  }
  public removeConnection(user: string): void {
    this.connections.delete(user);
  }

  public async handleGameMessage(userId: string, matchId: string, message: Buffer): Promise<void> {
    const { type, payload, gameMatch, player, socketP1, socketP2 } = this.validateMessage(
      userId,
      matchId,
      message
    );

    switch (type) {
      case 'move':
        try {
          // Tries to move the player || Throws an error if the move is invalid
          this.movePlayer(player, payload);
        } catch (error) {
          logger.warn(`An error occurred while trying to move player ${userId} ${payload}`);
          logger.error(error);
        }
        break;
      case 'attack':
        // Handle attack // TODO Implement attack --> Priority 2 <--- NOT MVP
        break;
      default:
        throw new MatchError(MatchError.INVALID_MESSAGE_TYPE);
    }
    this.notifyPlayers(socketP1, socketP2, gameMatch.getMatchDTO());
  }

  public registerConnection(user: string, socket: WebSocket): void {
    this.connections.set(user, socket);
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
    const { type, payload } = validateGameMessage(message.toString());

    const gameMatch = this.matches.get(matchId);
    if (!gameMatch) throw new MatchError(MatchError.MATCH_NOT_FOUND); // Not found in the matches map

    const socketP1 = this.connections.get(userId);
    const socketP2 = this.connections.get(gameMatch.getGuest());
    if (!socketP1) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the socketP1 connections
    if (!socketP2) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the socketP2 connections

    const player = gameMatch.getPlayer(userId);
    if (!player) throw new MatchError(MatchError.PLAYER_NOT_FOUND); // Not found in the match asocieated with the matchId

    return { type, payload, gameMatch, player, socketP1, socketP2 };
  }

  private movePlayer(player: Player, direction: string): void {
    switch (direction) {
      case 'up':
        player.moveUp();
        break;
      case 'down':
        player.moveDown();
        break;
      case 'left':
        player.moveLeft();
        break;
      case 'right':
        player.moveRight();
        break;
      default:
        throw new MatchError(MatchError.INVALID_MOVE);
    }
  }

  private notifyPlayers(socketP1: WebSocket, socketP2: WebSocket, dataDTO: unknown): void {
    socketP1.send(JSON.stringify(dataDTO));
    socketP2.send(JSON.stringify(dataDTO));
  }
}
export default GameServiceImpl;
