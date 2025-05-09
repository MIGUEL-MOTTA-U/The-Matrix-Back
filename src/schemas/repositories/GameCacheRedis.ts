import type { FastifyRedis } from '@fastify/redis';
import { logger } from '../../server.js';
import { type MatchStorage, validateMatchStorage } from '../zod.js';
import type GameCache from './GameCache.js';

export default class GameCacheRedis implements GameCache {
  private readonly redis: FastifyRedis;

  constructor(redis: FastifyRedis) {
    this.redis = redis;
  }
  public async getMatch(matchId: string): Promise<MatchStorage | null> {
    const key = `match:${matchId}`;
    const flat = await this.redis.hgetall(key);
    this.redis.expire(key, 15 * 60).catch((error) => {
      logger.warn(`Error setting expiration for match: ${matchId}`);
      logger.error(error);
    });
    if (!flat || !flat.id) return null;
    return validateMatchStorage({
      id: flat.id,
      level: Number(flat.level),
      map: flat.map,
      timeSeconds: Number(flat.timeSeconds),
      typeFruits: JSON.parse(flat.typeFruits),
      host: JSON.parse(flat.host),
      guest: JSON.parse(flat.guest),
      board: JSON.parse(flat.board),
    });
  }
  public async saveMatch(matchId: string, matchStorage: MatchStorage): Promise<void> {
    const key = `match:${matchId}`;
    const flat = {
      id: matchStorage.id,
      level: String(matchStorage.level),
      map: matchStorage.map,
      timeSeconds: String(matchStorage.timeSeconds),
      typeFruits: JSON.stringify(matchStorage.typeFruits),
      host: JSON.stringify(matchStorage.host),
      guest: JSON.stringify(matchStorage.guest),
      board: JSON.stringify(matchStorage.board),
    };
    const entries = Object.entries(flat).flat() as string[];
    await this.redis.hset(key, entries);
    this.redis.expire(key, 15 * 60).catch((error) => {
      logger.warn(`Error setting expiration for match: ${matchId}`);
      logger.error(error);
    });
  }
}
