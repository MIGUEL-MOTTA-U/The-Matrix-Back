import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import type GameService from '../../app/game/services/GameService.js';
import GameServiceImpl from '../../app/game/services/GameServiceImpl.js';
import GameError from '../../errors/GameError.js';
import {
  type MatchDetails,
  validateErrorMatch,
  validateMatchDetails,
  validateString,
} from '../../schemas/zod.js';
import { logger, redis } from '../../server.js';

/**
 * @class GameController
 * Handles WebSocket connections and game-related operations for matches.
 * This class manages user connections, match validation, and game state updates.
 *
 * @since 18/04/2025
 * @author
 * Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default class GameController {
  private static instance: GameController;
  private gameService: GameService = GameServiceImpl.getInstance();

  private constructor() {}

  /**
   * Retrieves the singleton instance of the GameController class.
   *
   * @return {GameController} The singleton instance of GameController.
   */
  public static getInstance(): GameController {
    if (!GameController.instance) GameController.instance = new GameController();
    return GameController.instance;
  }

  /**
   * Handles a WebSocket connection for a game.
   * Validates the user and match, registers the connection, and starts or reconnects the match.
   *
   * @param {WebSocket} socket The WebSocket connection for the user.
   * @param {FastifyRequest} request The HTTP request containing user and match details.
   * @return {Promise<void>} A promise that resolves when the connection is handled.
   */
  public async handleGameConnection(socket: WebSocket, request: FastifyRequest): Promise<void> {
    try {
      const { userId, matchId } = request.params as { userId: string; matchId: string };
      const matchIdParsed = validateString(matchId);
      const userIdParsed = validateString(userId);
      await this.validateUserExists(userIdParsed);
      const matchDetails = validateMatchDetails(await redis.hgetall(`matches:${matchIdParsed}`));
      if (matchDetails.host !== userIdParsed && matchDetails.guest !== userIdParsed)
        throw new GameError(GameError.USER_NOT_IN_MATCH);

      this.gameService.checkMatchDetails(matchDetails);
      const existingSocket = this.gameService.registerConnection(userIdParsed, socket);
      if (existingSocket) {
        await this.reconnectMatch(matchDetails, userIdParsed, socket);
      } else {
        await this.startMatch(matchDetails, userIdParsed, socket);
      }
      await this.gameService.extendUsersSession(userIdParsed);
      await this.gameService.extendMatchSession(matchIdParsed);

      socket.on('message', async (message: Buffer) => {
        try {
          await this.gameService.handleGameMessage(userIdParsed, matchIdParsed, message);
          await this.gameService.extendMatchSession(matchIdParsed);
          await this.gameService.extendUsersSession(userIdParsed);
        } catch (error) {
          logger.warn('An error occurred on Socket message request...');
          logger.error(error);
          if (error instanceof GameError) {
            socket.send(this.parseToString(validateErrorMatch({ error: error.message })));
          } else {
            socket.send(this.parseToString(validateErrorMatch({ error: 'Internal server error' })));
          }
        }
      });

      socket.on('close', () => {
        this.gameService.removeConnection(userIdParsed);
      });

      socket.on('error', (error: Error) => {
        logger.warn('An error occurred on Socket Connection...');
        logger.error(error);
      });
    } catch (error) {
      logger.warn('An error occurred on Game controller...');
      logger.error(error);
      socket.send(this.parseToString(validateErrorMatch({ error: 'Internal server error' })));
      socket.close();
      return;
    }
  }
  private parseToString(data: unknown): string {
    return JSON.stringify(data);
  }

  private async startMatch(
    matchDetails: MatchDetails,
    userIdParsed: string,
    socket: WebSocket
  ): Promise<void> {
    await this.gameService.startMatch(matchDetails.id);
    const updateMatch = this.gameService.getMatchUpdate(matchDetails.id);
    socket.send(this.parseToString(updateMatch));
    logger.info(`The User: ${userIdParsed} is connected to the match ${matchDetails.id}`);
  }

  private async reconnectMatch(
    matchDetails: MatchDetails,
    userIdParsed: string,
    socket: WebSocket
  ): Promise<void> {
    const updateMatch = this.gameService.getMatchUpdate(matchDetails.id);
    socket.send(this.parseToString(updateMatch));
    logger.info(
      `Player ${userIdParsed} reconnected to match ${matchDetails.id} \nHost: ${matchDetails.host} \nGuest: ${matchDetails.guest}\n`
    );
  }

  private async validateUserExists(userId: string): Promise<void> {
    const userExists = await redis.exists(`users:${userId}`);
    if (!userExists) throw new GameError(GameError.USER_NOT_FOUND);
  }
}
