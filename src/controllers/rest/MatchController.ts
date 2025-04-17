import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import MatchError from '../../errors/MatchError.js';
import { type MatchDetails, validateMatchInputDTO, validateString } from '../../schemas/zod.js';
import { redis } from '../../server.js';

export default class MatchController {
  private static instance: MatchController;
  private constructor() {}
  public static getInstance(): MatchController {
    if (!MatchController.instance) MatchController.instance = new MatchController();
    return MatchController.instance;
  }

  public async handleGetMatch(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const match = await redis.hgetall(`users:${userId}`);
    return res.send({ matchId: match.match });
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
}
