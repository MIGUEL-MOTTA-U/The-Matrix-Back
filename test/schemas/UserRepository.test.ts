import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { redis } from '../../src/server.js';
import UserRepositoryRedis from '../../src/schemas/repositories/UserRepositoryRedis.js';
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

describe('UserRepositoryRedis', () => {
  let userRepository: UserRepositoryRedis;

  beforeEach(() => {
    userRepository = new UserRepositoryRedis();
    vi.clearAllMocks();
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);
      const result = await userRepository.userExists('user123');
      expect(redis.exists).toHaveBeenCalledWith('users:user123');
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0);
      const result = await userRepository.userExists('user123');
      expect(redis.exists).toHaveBeenCalledWith('users:user123');
      expect(result).toBe(false);
    });
  });

  describe('extendSession', () => {
    it('should call expire with correct params', async () => {
      await userRepository.extendSession('user123', 10);
      expect(redis.expire).toHaveBeenCalledWith('users:user123', 600); // 10 * 60
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['users:user1', 'users:user2']);
      vi.mocked(redis.hgetall).mockResolvedValueOnce({ matchId: 'match1' });
      vi.mocked(redis.hgetall).mockResolvedValueOnce({ matchId: 'match2' });

      const users = await userRepository.getAllUsers();
      expect(redis.keys).toHaveBeenCalledWith('users:*');
      expect(redis.hgetall).toHaveBeenCalledTimes(2);
      expect(users).toEqual([
        { id: 'user1', matchId: 'match1' },
        { id: 'user2', matchId: 'match2' },
      ]);
    });
  });

  describe('deleteUser', () => {
    it('should call del with correct key', async () => {
      await userRepository.deleteUser('user123');
      expect(redis.del).toHaveBeenCalledWith('users:user123');
    });
  });

  describe('createUser', () => {
    it('should create a user with expiration', async () => {
      const user = { id: 'user123', matchId: 'match456' };
      await userRepository.createUser(user);
      expect(redis.hset).toHaveBeenCalledWith(
        'users:user123',
        'id',
        'user123',
        'matchId',
        'match456'
      );
      expect(redis.expire).toHaveBeenCalledWith('users:user123', 600); // 10 minutes
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({ matchId: 'match456' });
      const user = await userRepository.getUserById('user123');
      expect(redis.hgetall).toHaveBeenCalledWith('users:user123');
      expect(user).toEqual({ id: 'user123', matchId: 'match456' });
    });

    it('should throw error when user not found', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({});
      await expect(userRepository.getUserById('user123')).rejects.toThrow(MatchError);
      expect(redis.hgetall).toHaveBeenCalledWith('users:user123');
    });
  });

  describe('updateUser', () => {
    it('should update user data', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({ matchId: 'oldMatch' });
      const userData = { matchId: 'newMatch' };
      await userRepository.updateUser('user123', userData);
      expect(redis.hgetall).toHaveBeenCalledWith('users:user123');
      expect(redis.hset).toHaveBeenCalledWith('users:user123', userData);
    });

    it('should throw error when user not found', async () => {
      vi.mocked(redis.hgetall).mockResolvedValue({});
      await expect(userRepository.updateUser('user123', { matchId: 'match' })).rejects.toThrow(
        MatchError
      );
    });
  });
});
