import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { FastifyRedis } from '@fastify/redis';
import GameCacheRedis from '../../src/schemas/repositories/GameCacheRedis.js';
import { validateMatchStorage } from '../../src/schemas/zod.js';
import type { MatchStorage } from '../../src/schemas/zod.js';

const redis = mockDeep<FastifyRedis>();
const gameCache = new GameCacheRedis(redis);

vi.mock('../../src/server.js', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    config: {
      ENEMIES_SPEED_MS: 1000,
    },
  };
});

vi.mock('../../src/schemas/zod.js', async () => {
  const actual = await vi.importActual('../../src/schemas/zod.js');
  return {
    ...actual,
    validateMatchStorage: vi.fn(),
  };
});

describe('GameCacheRedis tests', () => {
  const mockMatchStorage: MatchStorage = {
    id: 'match1',
    level: 1,
    map: 'testmap',
    timeSeconds: 300,
    typeFruits: ['apple', 'banana'],
    host: {
      id: 'host1',
      color: 'red',
      coordinates: { x: 0, y: 0 },
      direction: 'up',
      state: 'alive',
    },
    guest: {
      id: 'guest1',
      color: 'blue',
      coordinates: { x: 1, y: 1 },
      direction: 'down',
      state: 'alive',
    },
    board: {
      fruitType: ['apple', 'banana'],
      fruitsContainer: ['apple', 'banana'],
      fruitsNumber: 2,
      fruitsRound: 1,
      currentRound: 1,
      currentFruitType: 'apple',
      rocksCoordinates: [[0, 0]],
      fruitsCoordinates: [[1, 1]],
      board: [],
    },
    fruitGenerated: true,
    paused: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateMatchStorage).mockReturnValue(mockMatchStorage);
  });

  describe('getMatch', () => {
    it('should return null if match is not found', async () => {
      redis.hgetall.mockResolvedValueOnce({});
      redis.expire.mockResolvedValueOnce(1);
      const result = await gameCache.getMatch('nonexistent');

      expect(result).toBeNull();
      expect(redis.hgetall).toHaveBeenCalledWith('match:nonexistent');
    });

    it('should return match data if found', async () => {
      const flatData = {
        id: 'match1',
        level: '1',
        map: 'testmap',
        timeSeconds: '300',
        typeFruits: JSON.stringify(['apple', 'banana']),
        host: JSON.stringify({
          id: 'host1',
          color: 'red',
          coordinates: { x: 0, y: 0 },
          direction: 'up',
          state: 'alive',
        }),
        guest: JSON.stringify({
          id: 'guest1',
          color: 'blue',
          coordinates: { x: 1, y: 1 },
          direction: 'down',
          state: 'alive',
        }),
        board: JSON.stringify({ cells: [] }),
        fruitGenerated: JSON.stringify(true),
        paused: JSON.stringify(false),
      };

      redis.hgetall.mockResolvedValueOnce(flatData);
      redis.expire.mockResolvedValueOnce(1);

      const result = await gameCache.getMatch('match1');

      expect(result).toBe(mockMatchStorage);
      expect(redis.hgetall).toHaveBeenCalledWith('match:match1');
      expect(redis.expire).toHaveBeenCalledWith('match:match1', 15 * 60);
      expect(validateMatchStorage).toHaveBeenCalledWith({
        id: 'match1',
        level: 1,
        map: 'testmap',
        timeSeconds: 300,
        typeFruits: ['apple', 'banana'],
        host: {
          id: 'host1',
          color: 'red',
          coordinates: { x: 0, y: 0 },
          direction: 'up',
          state: 'alive',
        },
        guest: {
          id: 'guest1',
          color: 'blue',
          coordinates: { x: 1, y: 1 },
          direction: 'down',
          state: 'alive',
        },
        board: { cells: [] },
        fruitGenerated: true,
        paused: false,
      });
    });

    it('should handle error when setting expiration', async () => {
      const flatData = {
        id: 'match1',
        level: '1',
        map: 'testmap',
        timeSeconds: '300',
        typeFruits: JSON.stringify(['apple', 'banana']),
        host: JSON.stringify({
          id: 'host1',
          color: 'red',
          coordinates: { x: 0, y: 0 },
          direction: 'up',
          state: 'alive',
        }),
        guest: JSON.stringify({
          id: 'guest1',
          color: 'blue',
          coordinates: { x: 1, y: 1 },
          direction: 'down',
          state: 'alive',
        }),
        board: JSON.stringify({ cells: [] }),
        fruitGenerated: JSON.stringify(true),
        paused: JSON.stringify(false),
      };

      redis.hgetall.mockResolvedValueOnce(flatData);
      redis.expire.mockRejectedValueOnce(new Error('Redis error'));

      const result = await gameCache.getMatch('match1');

      expect(result).toBe(mockMatchStorage);
      expect(redis.hgetall).toHaveBeenCalledWith('match:match1');
      expect(redis.expire).toHaveBeenCalledWith('match:match1', 15 * 60);
    });
  });

  describe('saveMatch', () => {
    it('should save match data correctly', async () => {
      redis.hset.mockResolvedValueOnce(0);
      redis.expire.mockResolvedValueOnce(1);

      await gameCache.saveMatch('match1', mockMatchStorage);

      expect(redis.hset).toHaveBeenCalledWith('match:match1', expect.any(Array));
      expect(redis.expire).toHaveBeenCalledWith('match:match1', 15 * 60);

      // Verify the flattened data structure passed to hset
      const hsetArgs = redis.hset.mock.calls[0][1];
      expect(hsetArgs).toContain('id');
      expect(hsetArgs).toContain('match1');
      expect(hsetArgs).toContain('level');
      expect(hsetArgs).toContain('1');
    });

    it('should handle error when setting expiration', async () => {
      redis.hset.mockResolvedValueOnce(0);
      redis.expire.mockRejectedValueOnce(new Error('Redis error'));

      await gameCache.saveMatch('match1', mockMatchStorage);

      expect(redis.hset).toHaveBeenCalledWith('match:match1', expect.any(Array));
      expect(redis.expire).toHaveBeenCalledWith('match:match1', 15 * 60);
    });
  });
});