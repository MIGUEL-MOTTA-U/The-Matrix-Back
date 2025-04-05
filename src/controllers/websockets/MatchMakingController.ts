import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import type { WebSocket } from 'ws';
import WebsocketService from '../../app/WebSocketServiceImpl.js';
import MatchError from '../../errors/MatchError.js';
import {
  type MatchDetails,
  validateMatchDetails,
  validateMatchInputDTO,
  validateString,
} from '../../schemas/zod.js';
import { logger, redis } from '../../server.js';
const websocketService = WebsocketService.getInstance();
/**
 * This class handles the errors different way a rest controller does.
 * It is responsible for managing WebSocket connections and handling messages.
 * It also provides matchmaking services for players looking for a match.
 */
export default class MatchMakingController {
  // Singleton instace
  private static instance: MatchMakingController;
  private constructor() {}
  public static getInstance(): MatchMakingController {
    if (!MatchMakingController.instance)
      MatchMakingController.instance = new MatchMakingController();
    return MatchMakingController.instance;
  }

  public async handleMatchMaking(socket: WebSocket, request: FastifyRequest) {
    try {
      const { matchId } = request.params as { matchId: string };
      const matchIdParsed = validateString(matchId);

      const match = validateMatchDetails(await redis.hgetall(`matches:${matchIdParsed}`));

      if (match.started) throw new MatchError(MatchError.MATCH_ALREADY_STARTED);

      websocketService.registerConnection(match.host, socket);

      socket.send(JSON.stringify({ message: 'Connected and looking for a match...' }));

      websocketService.matchMaking(match);

      logger.info(`Matchmaking from ${match.host}: looking for Match: ${JSON.stringify(match)}`);

      // Extend the expiration time of the match and user in Redis
      socket.on('message', (_message: Buffer) => {
        socket.send(JSON.stringify({ message: 'Matchmaking in progress...' }));
        redis.expire(`matches:${matchIdParsed}`, 10 * 60);
        redis.expire(`users:${match.host}`, 10 * 60);
      });

      socket.on('close', () => {
        websocketService.removeConnection(match.host);
      });

      socket.on('error', (error: Error) => {
        logger.warn('An error occurred on web scoket controller...');
        logger.error(error);
      });
    } catch (error) {
      logger.warn('An error occurred on web scoket controller...');
      logger.error(error);
      socket.send(JSON.stringify({ message: 'Internal server error' }));
      socket.close();
      return;
    }
  }

  public async handleCreateMatch(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const userIdParsed = validateString(userId);
    const user = await redis.hgetall(`users:${userIdParsed}`);
    if (Object.keys(user).length === 0) {
      throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    }
    if (user.match && Object.keys(user.match).length !== 0) {
      throw new MatchError(MatchError.PLAYER_ALREADY_IN_MATCH);
    }
    const matchInputDTO = validateMatchInputDTO(req.body as string);
    const matchDetails: MatchDetails = {
      id: uuidv4().replace(/-/g, '').slice(0, 8),
      host: userIdParsed,
      ...matchInputDTO,
    };

    redis.hset(
      `matches:${matchDetails.id}`,
      'id',
      matchDetails.id,
      'host',
      matchDetails.host,
      'guest',
      '',
      'level',
      matchDetails.level,
      'map',
      matchDetails.map
    );

    redis.expire(`matches:${matchDetails.id}`, 10 * 60);
    redis.hset(`users:${userIdParsed}`, 'match', matchDetails.id);
    return res.send({ matchId: matchDetails.id });
  }

  public async handleGetMatch(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const match = await redis.hgetall(`users:${userId}`);
    return res.send({ matchId: match.match });
  }
}
