import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { redis } from '../../src/server.js';
import UserRepositoryRedis from '../../src/schemas/repositories/UserRepositoryRedis.js';
import MatchError from '../../src/errors/MatchError.js';
import { mockDeep } from 'vitest-mock-extended';
import type { PrismaClient, User } from '@prisma/client';
import UserRepositoryPostgres from 'src/schemas/repositories/UserRepositoryPostgres.js';
import type { UserQueue } from '../../src/schemas/zod.js';

// Mock de usuario para tests
const mockUser: User = {
  id: 'user123',
  color: 'blue',
  matchId: 'match456',
  playerRole: 'HOST',
  expiredAt: new Date(Date.now() + 1200000),
  createdAt: new Date(),
  name: 'Anonymous',
  role: 'USER',
  updatedAt: new Date(),
  status: 'WAITING',
};
  
  const mockUserQueue: UserQueue = {
    id: 'user123',
    color: 'blue',
    matchId: 'match456',
    role: 'HOST',
    status: 'WAITING'
  };
  
  describe('UserRepositoryPostgres', () => {
    const mockPrisma = mockDeep<PrismaClient>();
    let userRepository: UserRepositoryPostgres;
  
    beforeEach(() => {
      vi.clearAllMocks();
      userRepository = new UserRepositoryPostgres(mockPrisma);
    });
  
    describe('userExists', () => {
      it('should return true when user exists', async () => {
        mockPrisma.user.count.mockResolvedValue(1);
        
        const result = await userRepository.userExists('user123');
        
        expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: { id: 'user123' } });
        expect(result).toBe(true);
      });
  
      it('should return false when user does not exist', async () => {
        mockPrisma.user.count.mockResolvedValue(0);
        
        const result = await userRepository.userExists('user123');
        
        expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: { id: 'user123' } });
        expect(result).toBe(false);
      });
    });
  
    describe('extendSession', () => {
      it('should update user expiration time', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        
        await userRepository.extendSession('user123', 10);
        
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
        expect(mockPrisma.user.update).toHaveBeenCalled();
        const updateCall = mockPrisma.user.update.mock.calls[0][0];
        expect(updateCall.where).toEqual({ id: 'user123' });
        expect(updateCall.data.expiredAt).toBeInstanceOf(Date);
      });
  
      it('should throw error when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        
        await expect(userRepository.extendSession('user123', 10)).rejects.toThrow(MatchError);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
      });
    });
  
    describe('getAllUsers', () => {
      it('should return all users', async () => {
        const mockUsers: User[] = [
          { ...mockUser, id: 'user1', matchId: 'match1' },
          { ...mockUser, id: 'user2', matchId: 'match2' }
        ];
        
        mockPrisma.user.findMany.mockResolvedValue(mockUsers);
        
        const users = await userRepository.getAllUsers();
        
        expect(mockPrisma.user.findMany).toHaveBeenCalled();
        expect(users).toHaveLength(2);
        expect(users[0].id).toBe('user1');
        expect(users[1].id).toBe('user2');
        expect(users[0].matchId).toBe('match1');
        expect(users[1].matchId).toBe('match2');
      });
    });
  
    describe('deleteUser', () => {
      it('should delete a user successfully', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        
        await userRepository.deleteUser('user123');
        
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
        expect(mockPrisma.user.delete).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
      });
  
      it('should throw error when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        
        await expect(userRepository.deleteUser('user123')).rejects.toThrow(MatchError);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
        expect(mockPrisma.user.delete).not.toHaveBeenCalled();
      });
    });
  
    describe('createUser', () => {
      it('should create a user with expiration', async () => {
        await userRepository.createUser(mockUserQueue);
        
        expect(mockPrisma.user.create).toHaveBeenCalled();
        const createCall = mockPrisma.user.create.mock.calls[0][0];
        expect(createCall.data.id).toBe('user123');
        expect(createCall.data.matchId).toBe('match456');
        expect(createCall.data.color).toBe('blue');
        expect(createCall.data.playerRole).toBe('HOST');
        expect(createCall.data.expiredAt).toBeInstanceOf(Date);
      });
    });
  
    describe('getUserById', () => {
      it('should return user when found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        
        const user = await userRepository.getUserById('user123');
        
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
        expect(user).toEqual({
          id: 'user123',
          color: 'blue',
          name: 'Anonymous',
          matchId: 'match456',
          role: 'HOST',
          status: 'WAITING',
        });
      });
  
      it('should throw error when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        
        await expect(userRepository.getUserById('user123')).rejects.toThrow(MatchError);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
      });
    });
  
    describe('updateUser', () => {
      it('should update user data correctly', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        const userData: Partial<UserQueue> = { 
          color: 'red', 
          matchId: 'newMatch', 
          role: 'HOST' ,
          status: 'WAITING'

        };
        
        await userRepository.updateUser('user123', userData);
        
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user123' }
        });
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user123' },
          data: {
            color: 'red',
            matchId: 'newMatch',
            playerRole: 'HOST',
            status: 'WAITING'
          }
        });
      });
  
      it('should set matchId to null when empty string provided', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        const userData: Partial<UserQueue> = { matchId: '' };
        
        await userRepository.updateUser('user123', userData);
        
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user123' },
          data: expect.objectContaining({
            matchId: null
          })
        });
      });
  
      it('should throw error when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);
        
        await expect(userRepository.updateUser('user123', { color: 'green' })).rejects.toThrow(MatchError);
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });
    });
  });