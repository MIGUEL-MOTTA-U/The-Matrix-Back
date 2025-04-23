import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redis } from '../../src/server.js';
import MatchRepositoryRedis from '../../src/schemas/MatchRepositoryRedis.js';
import MatchError from '../../src/errors/MatchError.js';

vi.mock('../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    keys: vi.fn(),
    hgetall: vi.fn(),
    hset: vi.fn(),
  },
}));

// Mock the validateMatchDetails function
vi.mock('../../src/schemas/zod.js', () => ({
  validateMatchDetails: vi.fn((data) => data),
}));

describe('MatchRepositoryRedis', () => {
  let matchRepository: MatchRepositoryRedis;

  beforeEach(() => {
    matchRepository = new MatchRepositoryRedis();
    vi.clearAllMocks();
  });

  describe('getMatchById', () => {
    it('should return match when found', async () => {
      const matchData = {
        id: 'match123',
        host: 'user1',
        guest: 'user2',
        level: '1',
        map: 'desert',
      };
      vi.mocked(redis.hgetall).mockResolvedValue(matchData);

      const match = await matchRepository.getMatchById('match123');
      expect(redis.hgetall).toHaveBeenCalledWith('matches:match123');
      expect(match).toEqual(matchData);
    });
  });

  describe('extendSession', () => {
    it('should call expire with correct params', async () => {
      await matchRepository.extendSession('match123', 10);
      expect(redis.expire).toHaveBeenCalledWith('matches:match123', 600); // 10 * 60
    });
  });

  describe('removeMatch', () => {
    it('should call del with correct key', async () => {
      await matchRepository.removeMatch('match123');
      expect(redis.del).toHaveBeenCalledWith('matches:match123');
    });
  });

  describe('updateMatch', () => {
    it('should update match data', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({ id: 'match123', host: 'user1' });
      const matchData = { guest: 'user2' };

      await matchRepository.updateMatch('match123', matchData);
      expect(redis.hgetall).toHaveBeenCalledWith('matches:match123');
      expect(redis.hset).toHaveBeenCalledWith('matches:match123', matchData);
      expect(redis.expire).toHaveBeenCalledWith('matches:match123', 600); // 10 minutes
    });

    it('should throw error when match not found', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({});

      await expect(matchRepository.updateMatch('match123', { guest: 'user2' })).rejects.toThrow(
        MatchError
      );
      expect(redis.hgetall).toHaveBeenCalledWith('matches:match123');
    });
  });

  describe('matchExists', () => {
    it('should return true when match exists', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);

      const result = await matchRepository.matchExists('match123');
      expect(redis.exists).toHaveBeenCalledWith('matches:match123');
      expect(result).toBe(true);
    });

    it('should return false when match does not exist', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0);

      const result = await matchRepository.matchExists('match123');
      expect(redis.exists).toHaveBeenCalledWith('matches:match123');
      expect(result).toBe(false);
    });
  });

  describe('createMatch', () => {
    it('should create a match with expiration', async () => {
      const match = {
        id: 'match123',
        host: 'user1',
        guest: 'user2',
        level: 1,
        map: 'desert',
      };

      await matchRepository.createMatch(match);
      expect(redis.hset).toHaveBeenCalledWith(
        'matches:match123',
        'id',
        'match123',
        'host',
        'user1',
        'guest',
        'user2',
        'level',
        1,
        'map',
        'desert'
      );
      expect(redis.expire).toHaveBeenCalledWith('matches:match123', 600); // 10 minutes
    });

    it('should handle empty guest field', async () => {
      const match = {
        id: 'match123',
        host: 'user1',
        guest: '',
        level: 1,
        map: 'desert',
      };

      await matchRepository.createMatch(match);
      expect(redis.hset).toHaveBeenCalledWith(
        'matches:match123',
        'id',
        'match123',
        'host',
        'user1',
        'guest',
        '',
        'level',
        1,
        'map',
        'desert'
      );
    });
  });
});