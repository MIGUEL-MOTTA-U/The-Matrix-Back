import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, mockReset } from 'vitest-mock-extended';
import type { FastifyReply, FastifyRequest } from 'fastify';
import MatchController from '../../src/controllers/rest/MatchController.js';
import type MatchRepository from '../../src/schemas/MatchRepository.js';
import type UserRepository from '../../src/schemas/UserRepository.js';
import { validateMatchInputDTO, validateString } from '../../src/schemas/zod.js';
const mockMatchRepository = mock<MatchRepository>();
const mockUserRepository = mock<UserRepository>();

vi.mock('../../src/schemas/repositories/MatchRepositoryRedis', () => ({
  default: { getInstance: () => mockMatchRepository },
}));

vi.mock('../../src/schemas/repositories/UserRepositoryRedis', () => ({
  default: { getInstance: () => mockUserRepository },
}));

vi.mock('../../src/schemas/zod', () => ({
  validateMatchInputDTO: vi.fn(),
  validateString: vi.fn(),
}));

describe('MatchController', () => {
  let matchController: MatchController;

  beforeEach(() => {
    mockReset(mockMatchRepository);
    mockReset(mockUserRepository);
    vi.clearAllMocks();
    matchController = new MatchController(mockUserRepository, mockMatchRepository);
  });

  describe('handleGetMatch', () => {
    it('should return the match ID for a valid user', async () => {
      const req = { params: { userId: 'user123' } } as unknown as FastifyRequest;
      const res = { send: vi.fn() } as unknown as FastifyReply;

      mockUserRepository.getUserById.mockResolvedValue({
        matchId: 'match123',
        id: '',
        status: 'READY'
      });

      await matchController.handleGetMatch(req, res);

      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('user123');
      expect(res.send).toHaveBeenCalledWith({ matchId: 'match123' });
    });
  });

  describe('handleCreateMatch', () => {
    it('should create a match and return its ID', async () => {
      const req = {
        params: { userId: 'user123' },
        body: { level: 1, map: 'test-map' }, 
      } as unknown as FastifyRequest;
      const res = { send: vi.fn() } as unknown as FastifyReply;
  
      vi.mocked(validateString).mockReturnValue('user123');
      vi.mocked(validateMatchInputDTO).mockReturnValue({ level: 1, map: 'test-map' }); 
      mockUserRepository.getUserById.mockResolvedValue({
        matchId: null,
        id: '',
        status: 'READY'
      });
      mockMatchRepository.createMatch.mockResolvedValue();
      mockUserRepository.updateUser.mockResolvedValue();
  
      await matchController.handleCreateMatch(req, res);
  
      expect(validateString).toHaveBeenCalledWith('user123');
      expect(validateMatchInputDTO).toHaveBeenCalledWith(req.body);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith('user123');
      expect(mockMatchRepository.createMatch).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          host: 'user123',
          level: 1, 
          map: 'test-map', 
        })
      );
      expect(mockUserRepository.updateUser).toHaveBeenCalledWith('user123', {
        matchId: expect.any(String),
      });
      expect(res.send).toHaveBeenCalledWith({ matchId: expect.any(String) });
    });

    it('should update the level and map of an existing match', async () => {
      const req = {
        params: { matchId: 'match123' },
        body: { level: 2, map: 'new-map' },
      } as unknown as FastifyRequest;
      const res = { send: vi.fn() } as unknown as FastifyReply;

      mockMatchRepository.updateMatch.mockResolvedValue();

      await matchController.handleUpdateMatch(req, res);

      expect(mockMatchRepository.updateMatch).toHaveBeenCalledWith('match123', {
        level: 2,
        map: 'new-map',
      });
      expect(res.send).toHaveBeenCalledWith({ message: 'Match updated successfully' });
    });
  });
});