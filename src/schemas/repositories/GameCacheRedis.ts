import type { FastifyRedis } from '@fastify/redis';
import { logger } from '../../server.js';
import { type MatchStorage, validateMatchStorage } from '../zod.js';
import type GameCache from './GameCache.js';

/**
 * This class implements the GameCache interface using Redis as the storage backend.
 * It provides methods to save and retrieve match data.
 * @class GameCacheRedis
 *
 * @since 9/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class GameCacheRedis implements GameCache {
  private readonly redis: FastifyRedis;

  constructor(redis: FastifyRedis) {
    this.redis = redis;
  }
  public async removeMatch(matchId: string): Promise<void> {
    const key = `match:${matchId}`;
    await this.redis.del(key).catch((error) => {
      logger.warn(`Error deleting match: ${matchId}`);
      logger.error(error);
    });
  }
  /**
   * This method retrieves a match from the Redis cache.
   * It uses a hash to store the match data, with the key being the match ID.
   * @param {string} matchId The ID of the match to retrieve.
   * @returns {Promise<MatchStorage | null>} The match data or null if not found.
   */
  public async getMatch(matchId: string): Promise<MatchStorage | null> {
    const key = `match:${matchId}`;
    const flat = await this.redis.hgetall(key);
    this.redis.expire(key, 15 * 60).catch((error) => {
      logger.warn(`Error setting expiration for match: ${matchId}`);
      logger.error(error);
    });
    if (!flat.id) return null;
    return validateMatchStorage({
      id: flat.id,
      level: Number(flat.level),
      map: flat.map,
      timeSeconds: Number(flat.timeSeconds),
      host: JSON.parse(flat.host),
      guest: JSON.parse(flat.guest),
      board: JSON.parse(flat.board),
      fruitGenerated: JSON.parse(flat.fruitGenerated),
      paused: JSON.parse(flat.paused),
    });
  }
  /**
   * This method saves a match to the Redis cache.
   * It uses a hash to store the match data, with the key being the match ID.
   * @param {string} matchId The ID of the match to save.
   * @param {MatchStorage} matchStorage
   */
  public async saveMatch(matchId: string, matchStorage: MatchStorage): Promise<void> {
    const key = `match:${matchId}`;
    const flat = {
      id: matchStorage.id,
      level: String(matchStorage.level),
      map: matchStorage.map,
      timeSeconds: String(matchStorage.timeSeconds),
      host: JSON.stringify(matchStorage.host),
      guest: JSON.stringify(matchStorage.guest),
      board: JSON.stringify(matchStorage.board),
      fruitGenerated: JSON.stringify(matchStorage.fruitGenerated),
      paused: JSON.stringify(matchStorage.paused),
    };
    const entries: string[] = Object.entries(flat).flat();
    await this.redis.hset(key, entries);
    this.redis.expire(key, 15 * 60).catch((error) => {
      logger.warn(`Error setting expiration for match: ${matchId}`);
      logger.error(error);
    });
  }
}
