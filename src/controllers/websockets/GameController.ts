import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { ZodError } from 'zod';
import type GameService from '../../app/game/services/GameService.js';
import GameError from '../../errors/GameError.js';
import type MatchRepository from '../../schemas/MatchRepository.js';
import type UserRepository from '../../schemas/UserRepository.js';
import { type MatchDetails, validateErrorMatch, validateString } from '../../schemas/zod.js';
import { logger } from '../../server.js';
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
  private readonly matchRepository: MatchRepository;
  private readonly userRepository: UserRepository;
  private readonly gameService: GameService;

  constructor(
    matchRepository: MatchRepository,
    userRepository: UserRepository,
    gameService: GameService
  ) {
    this.gameService = gameService;
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
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
      const {
        matchId: matchIdParsed,
        userId: userIdParsed,
        matchDetails,
      } = await this.validateData(request.params);
      const existingSocket = this.gameService.registerConnection(userIdParsed, socket);
      if (existingSocket) {
        await this.reconnectMatch(matchDetails, userIdParsed, socket);
      } else {
        await this.startMatch(matchDetails, userIdParsed, socket);
      }
      await this.extendSession(userIdParsed, matchIdParsed);

      socket.on('message', async (message: Buffer) => {
        try {
          await this.gameService.handleGameMessage(userIdParsed, matchIdParsed, message);
          await this.extendSession(userIdParsed, matchIdParsed);
        } catch (error) {
          this.handleError(error, socket);
        }
      });

      socket.on('close', () => {
        this.gameService.removeConnection(userIdParsed);
      });

      socket.on('error', (error: Error) => {
        this.handleError(error, socket);
      });
    } catch (error) {
      this.handleError(error, socket);
      socket.close();
      return;
    }
  }
  private async extendSession(userId: string, matchId: string): Promise<void> {
    this.gameService.extendUsersSession(userId);
    this.gameService.extendMatchSession(matchId);
  }

  private async validateData(
    data: unknown
  ): Promise<{ matchId: string; userId: string; matchDetails: MatchDetails }> {
    const { userId, matchId } = data as { userId: string; matchId: string };
    const matchIdParsed = validateString(matchId);
    const userIdParsed = validateString(userId);
    await this.validateUserExists(userIdParsed);
    await this.validateMatchExists(matchIdParsed);
    const matchDetails = await this.matchRepository.getMatchById(matchIdParsed);
    if (matchDetails.host !== userIdParsed && matchDetails.guest !== userIdParsed)
      throw new GameError(GameError.USER_NOT_IN_MATCH);
    this.gameService.checkMatchDetails(matchDetails);
    return { matchId: matchIdParsed, userId: userIdParsed, matchDetails };
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

  private handleError(error: unknown, socket: WebSocket): void {
    logger.warn('An error occurred on Socket message request...');
    logger.error(error);
    if (error instanceof GameError) {
      socket.send(
        this.parseToString(validateErrorMatch({ error: `${error.code}, ${error.message}` }))
      );
    } else if (error instanceof ZodError) {
      socket.send(this.parseToString(validateErrorMatch({ error: 'Bad Request' })));
    } else {
      socket.send(this.parseToString(validateErrorMatch({ error: 'Internal server error' })));
    }
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
    const userExists = await this.userRepository.userExists(userId);
    if (!userExists) throw new GameError(GameError.USER_NOT_FOUND);
  }

  private async validateMatchExists(matchId: string): Promise<void> {
    const matchExists = await this.matchRepository.matchExists(matchId);
    if (!matchExists) throw new GameError(GameError.MATCH_NOT_FOUND);
  }
}
