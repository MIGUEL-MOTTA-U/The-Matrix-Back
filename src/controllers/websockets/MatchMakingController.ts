import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import WebsocketService from '../../app/lobbies/services/WebSocketServiceImpl.js';
import MatchError from '../../errors/MatchError.js';
import type MatchRepository from '../../schemas/MatchRepository.js';
import MatchRepositoryRedis from '../../schemas/MatchRepositoryRedis.js';
import type UserRepository from '../../schemas/UserRepository.js';
import UserRepositoryRedis from '../../schemas/UserRepositoryRedis.js';
import {
  type ErrorMatch,
  type Info,
  type MatchDetails,
  validateErrorMatch,
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
  private readonly websocketService = WebsocketService.getInstance();
  private readonly matchRepository: MatchRepository = MatchRepositoryRedis.getInstance();
  private readonly userRepository: UserRepository = UserRepositoryRedis.getInstance();
  // Singleton instace
  private static instance: MatchMakingController;
  private constructor() {}
  public static getInstance(): MatchMakingController {
    if (!MatchMakingController.instance)
      MatchMakingController.instance = new MatchMakingController();
    return MatchMakingController.instance;
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
      this.logError(error);
      this.sendMessage(socket, validateErrorMatch({ error: 'Internal server error' }));
      socket.close();
      return;
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

  private sendMessage(socket: WebSocket, message: ErrorMatch | Info): void {
    socket.send(JSON.stringify(message));
  }

  private async validateMatch(data: unknown): Promise<MatchDetails> {
    const { matchId } = data as { matchId: string };
    const matchIdParsed = validateString(matchId);
    const match = await this.matchRepository.getMatchById(matchIdParsed);
    return match;
  }
}
