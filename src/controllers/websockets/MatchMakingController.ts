import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type WebSocketService from '../../app/lobbies/services/WebSocketService.js';
import MatchError from '../../errors/MatchError.js';
import type MatchRepository from '../../schemas/MatchRepository.js';
import type UserRepository from '../../schemas/UserRepository.js';
import {
  type GameMessageOutput,
  type Info,
  type MatchDetails,
  validateErrorMatch,
  validateGameMessageOutput,
  validateInfo,
  validateString,
} from '../../schemas/zod.js';
import { logger } from '../../server.js';
/**
 * @class MatchMakingController
 * This class handles the errors different way a rest controller does.
 * It is responsible for managing WebSocket connections and handling messages.
 * It also provides matchmaking services for players looking for a match.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class MatchMakingController {
  private readonly websocketService: WebSocketService;
  private readonly matchRepository: MatchRepository;
  private readonly userRepository: UserRepository;
  constructor(
    webSocketService: WebSocketService,
    matchRepository: MatchRepository,
    userRepository: UserRepository
  ) {
    this.websocketService = webSocketService;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
  }

  /**
   * This method handles the matchmaking process for a player.
   * @param {WebSocket} socket The socket connection to the client
   * @param {FastifyRequest} request The request object containing the match details
   * @returns {Promise<void>} A promise that resolves when the matchmaking process is complete
   * @throws {MatchError} if the match is already started or if there is an internal server error
   */
  public async handleMatchMaking(socket: WebSocket, request: FastifyRequest): Promise<void> {
    try {
      const match = await this.validateMatch(request.params);
      if (match.started) throw new MatchError(MatchError.MATCH_ALREADY_STARTED);
      this.websocketService.registerConnection(match.host, socket);
      this.sendMessage(socket, validateInfo({ message: 'Connected and looking for a match...' }));
      this.websocketService.matchMaking(match);
      this.extendExpiration(match.id, match.host);
      logger.info(`Matchmaking from ${match.host}: looking for Match: ${JSON.stringify(match)}`);

      socket.on('message', (_message: Buffer) => {
        this.sendMessage(socket, validateInfo({ message: 'Matchmaking in progress...' }));
        this.extendExpiration(match.id, match.host);
      });

      socket.on('close', () => {
        this.websocketService.removeConnection(match.host);
      });

      socket.on('error', (error: Error) => {
        this.logError(error);
      });
    } catch (error) {
      this.handleError(error, socket);
    }
  }

  /**
   * This method publishes a match to be hosted.
   *
   * @param {WebSocket} socket The socket connection to the client hosting the match
   * @param {FastifyRequest} request The request object containing the match details
   * @return {Promise<void>} A promise that resolves when the match is published
   */
  public async handlePublishMatch(socket: WebSocket, request: FastifyRequest): Promise<void> {
    try {
      const matchDetails = await this.validateMatch(request.params);
      const hostId = await this.validateUserId(request.params);
      if (matchDetails.host !== hostId) throw new MatchError(MatchError.PLAYER_ALREADY_IN_MATCH);
      await this.websocketService.validateMatchToPublish(matchDetails.id, hostId);
      this.websocketService.publishMatch(matchDetails.id, socket);

      socket.on('message', (_message: Buffer) => {
        this.sendMessage(socket, validateInfo({ message: 'Match published successfully!' }));
        this.extendExpiration(matchDetails.id, hostId);
      });

      socket.on('close', () => {
        this.websocketService.removePublishedMatch(matchDetails.id);
      });

      socket.on('error', (error: Error) => {
        this.logError(error);
        const errorMatch = validateErrorMatch({ error: 'Internal server error' });
        const messageOutput: GameMessageOutput = validateGameMessageOutput({
          type: 'error',
          payload: errorMatch,
        });
        this.sendMessage(socket, messageOutput);
        socket.close();
      });
    } catch (error) {
      this.handleError(error, socket);
    }
  }

  /**
   * This method handles the request to join a game.
   *
   * @param {WebSocket} guestSocket The socket connection to the client
   * @param {FastifyRequest} request The request object containing the match details
   * @returns {Promise<void>} A promise that resolves when the join game process is complete
   */
  public async handleJoinGame(guestSocket: WebSocket, request: FastifyRequest): Promise<void> {
    try {
      const matchDetails = await this.validateMatch(request.params);
      const guestId = await this.validateUserId(request.params);
      if (matchDetails.host === guestId) throw new MatchError(MatchError.PLAYER_ALREADY_IN_MATCH);
      await this.websocketService.validateMatchToJoin(matchDetails.id, guestId);
      await this.websocketService.joinGame(matchDetails, guestId, guestSocket);
      guestSocket.on('error', (error: Error) => {
        this.logError(error);
      });
      guestSocket.on('message', (_message: Buffer) => {
        this.sendMessage(guestSocket, validateInfo({ message: 'Joining game...' }));
        this.extendExpiration(matchDetails.id, guestId);
      });
    } catch (error) {
      this.handleError(error, guestSocket);
    }
  }

  private async extendExpiration(matchId: string, userId: string): Promise<void> {
    await this.matchRepository.extendSession(matchId, 10);
    await this.userRepository.extendSession(userId, 10);
  }

  private logError(error: unknown): void {
    logger.warn('An error occurred on web scoket controller...');
    logger.error(error);
  }

  private sendMessage(socket: WebSocket, message: GameMessageOutput | Info): void {
    socket.send(JSON.stringify(message));
  }

  private async validateMatch(data: unknown): Promise<MatchDetails> {
    const { matchId } = data as { matchId: string };
    const matchIdParsed = validateString(matchId);
    const match = await this.matchRepository.getMatchById(matchIdParsed);
    return match;
  }
  private async validateUserId(data: unknown): Promise<string> {
    const { userId } = data as { userId: string };
    const userIdParsed = validateString(userId);
    const user = await this.userRepository.getUserById(userIdParsed);
    return user.id;
  }

  private handleError(error: unknown, socket: WebSocket): void {
    this.logError(error);
    const errorMatch = validateErrorMatch({ error: 'Internal server error' });
    const messageOutput = validateGameMessageOutput({ type: 'error', payload: errorMatch });
    this.sendMessage(socket, messageOutput);
    socket.close();
  }
}
