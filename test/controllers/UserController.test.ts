import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import UserController from '../../src/controllers/rest/UserController.js';
import { v4 as uuidv4 } from 'uuid';
import { mockDeep } from 'vitest-mock-extended';
import type UserRepository from '../../src/schemas/UserRepository.js';
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'fixed-uuid'),
}));



vi.mock('../../src/schemas/zod.js', () => ({
  validateString: vi.fn((str: string) => str),
  validateUserQueue: vi.fn((user: { id: string; matchId: string | null }) => user),
}));
vi.mock('../../src/server.js', () => ({
  redis: {
    hset: vi.fn(() => Promise.resolve()),
    hgetall: vi.fn(() => Promise.resolve({ id: 'fixed-uuid', name: 'Test User' })),
    expire: vi.fn(() => Promise.resolve()),
    keys: vi.fn(() => Promise.resolve(['fixed-uuid'])),
  },
}));
const userRepository = mockDeep<UserRepository>();
describe('UserController', () => {
  let req: FastifyRequest;
  let res: FastifyReply;
  let controller: UserController;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      params: { userId: 'fixed-uuid' },
    } as unknown as FastifyRequest;

    res = {
      send: vi.fn(),
    } as unknown as FastifyReply;
    
    controller = new UserController(userRepository);
  });

  describe('handleCreateUser', () => {
    

    it('should create a user and send the generated userId', async () => {
      userRepository.createUser.mockResolvedValue(undefined);
      await controller.handleCreateUser(req, res);

      expect(uuidv4).toHaveBeenCalled();

      expect(res.send).toHaveBeenCalledWith({ userId: 'fixed-uuid' });
    });
  });

  describe('handleGetUser', () => {
    it('should validate the userId, retrieve the user from Redis and send the user object', async () => {
      userRepository.getUserById.mockResolvedValue({
        id: 'fixed-uuid',
        matchId: 'matchId',
      });
      
      await controller.handleGetUser(req, res);

      expect(res.send).toHaveBeenCalledWith({ id: 'fixed-uuid', matchId: 'matchId' });
    });
  });

  describe('handleGetUsers', () => {
    it('should retrieve all users from Redis and send the user list', async () => {
      req = {
        params: {},
      } as unknown as FastifyRequest;

      userRepository.getAllUsers.mockResolvedValue([{
      id: 'fixed-uuid',
      matchId: 'fixed-match-id'
      }]);
      await controller.handleGetUsers(req, res);

      expect(res.send).toHaveBeenCalledWith([{ id: 'fixed-uuid', matchId: 'fixed-match-id' }]);
    });
  });
});
