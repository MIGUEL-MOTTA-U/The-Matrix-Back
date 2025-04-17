import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MatchController from '../../src/controllers/rest/MatchController.js';
import MatchError from '../../src/errors/MatchError.js';
import { redis } from '../../src/server.js';
import { validateString, validateMatchInputDTO } from '../../src/schemas/zod.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

vi.mock('../../src/server.js', () => ({
  redis: {
    hgetall: vi.fn(),
    hset: vi.fn(),
    expire: vi.fn(),
  },
}));

vi.mock('../../src/schemas/zod.js', () => ({
  validateString: vi.fn((input) => input),
  validateMatchInputDTO: vi.fn((input) => input),
}));

describe('MatchController', () => {
  let mockReply: { send: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReply = { send: vi.fn() };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('handleGetMatch', () => {
    it('should retrieve the match id from user record and send it in response', async () => {
      (redis.hgetall as Mock).mockResolvedValue({ match: 'match789' });
      const req = { params: { userId: 'user123' } } as unknown as FastifyRequest;
      const controller = MatchController.getInstance();

      await controller.handleGetMatch(req, mockReply as unknown as FastifyReply);

      expect(redis.hgetall).toHaveBeenCalledWith('users:user123');
      expect(mockReply.send).toHaveBeenCalledWith({ matchId: 'match789' });
    });
  });

  describe('handleCreateMatch', () => {
    it('should create a match and return a match id', async () => {
      (redis.hgetall as Mock).mockResolvedValue({id: 'user123', name: 'Test User' });
      const req = {
        params: { userId: 'user123' },
        body: JSON.stringify({ level: 3, map: 'city' }),
      } as unknown as FastifyRequest;
      const controller = MatchController.getInstance();

      await controller.handleCreateMatch(req, mockReply as unknown as FastifyReply);

      expect(validateString).toHaveBeenCalledWith('user123');
      expect(validateMatchInputDTO).toHaveBeenCalledWith(JSON.stringify({ level: 3, map: 'city' }));
      expect(redis.hset).toHaveBeenCalledTimes(2);
      expect(redis.expire).toHaveBeenCalledWith(expect.stringContaining('matches:'), 10 * 60);
      expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({ matchId: expect.any(String) }));
    });

    it('should throw PLAYER_NOT_FOUND error if user does not exist', async () => {
      (redis.hgetall as Mock).mockResolvedValue({});
      const req = { params: { userId: 'user123' }, body: '{}' } as unknown as FastifyRequest;
      const controller = MatchController.getInstance();

      await expect(controller.handleCreateMatch(req, mockReply as unknown as FastifyReply)).rejects.toThrow(MatchError.PLAYER_NOT_FOUND);
    });

    it('should throw PLAYER_ALREADY_IN_MATCH error if user is already in a match', async () => {
      (redis.hgetall as Mock).mockResolvedValue({ match: 'match123' });
      const req = { params: { userId: 'user123' }, body: '{}' } as unknown as FastifyRequest;
      const controller = MatchController.getInstance();

      await expect(controller.handleCreateMatch(req, mockReply as unknown as FastifyReply)).rejects.toThrow(MatchError.PLAYER_ALREADY_IN_MATCH);
    });
  });
}); 
