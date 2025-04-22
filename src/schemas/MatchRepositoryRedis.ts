import MatchError from '../errors/MatchError.js';
import { redis } from '../server.js';
import type MatchRepository from './MatchRepository.js';
import { type MatchDetails, validateMatchDetails } from './zod.js';

export default class MatchRepositoryRedis implements MatchRepository {
  private static instance: MatchRepositoryRedis;
  private constructor() {}
  public async getMatchById(matchId: string): Promise<MatchDetails> {
    return validateMatchDetails(await redis.hgetall(`matches:${matchId}`));
  }
  public async extendSession(matchId: string, duration: number): Promise<void> {
    await redis.expire(`matches:${matchId}`, duration * 60);
  }
  public async removeMatch(matchId: string): Promise<void> {
    await redis.del(`matches:${matchId}`);
  }
  public async updateMatch(matchId: string, matchData: Partial<MatchDetails>): Promise<void> {
    const match = await redis.hgetall(`matches:${matchId}`);
    if (Object.keys(match).length === 0) {
      throw new MatchError(MatchError.MATCH_NOT_FOUND);
    }
    await redis.hset(`matches:${matchId}`, matchData);
    await redis.expire(`matches:${matchId}`, 10 * 60);
  }
  public static getInstance(): MatchRepositoryRedis {
    if (!MatchRepositoryRedis.instance) {
      MatchRepositoryRedis.instance = new MatchRepositoryRedis();
    }
    return MatchRepositoryRedis.instance;
  }
  public async matchExists(matchId: string): Promise<boolean> {
    return (await redis.exists(`matches:${matchId}`)) === 1;
  }
  public async createMatch(match: MatchDetails): Promise<void> {
    const matchId = match.id;
    await redis.hset(
      `matches:${matchId}`,
      'id',
      matchId,
      'host',
      match.host,
      'guest',
      match.guest || '',
      'level',
      match.level,
      'map',
      match.map
    );
    await redis.expire(`matches:${matchId}`, 10 * 60);
  }
}
