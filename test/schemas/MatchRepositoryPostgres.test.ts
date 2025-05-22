import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { PrismaClient, Match, User } from '@prisma/client';
import MatchRepositoryPostgres from '../../src/schemas/repositories/MatchRepositoryPostgres.js';
import MatchError from '../../src/errors/MatchError.js';
import type { MatchDetails } from '../../src/schemas/zod.js';

// Mock de partida para tests
const mockMatch: Match & { players: User[] } = {
  id: 'match123',
  level: 1,
  map: 'default',
  started: false,
  expiredAt: new Date(Date.now() + 1200000),
  createdAt: new Date(),
  updatedAt: new Date(),
  players: [
    {
      id: 'user123',
      color: 'blue',
      matchId: 'match123',
      playerRole: 'HOST',
      expiredAt: new Date(Date.now() + 1200000),
      createdAt: new Date(),
      name: 'Player1',
      role: 'USER',
      updatedAt: new Date(),
      status: 'READY'
    },
    {
      id: 'user456',
      color: 'red',
      matchId: 'match123',
      playerRole: 'GUEST',
      expiredAt: new Date(Date.now() + 1200000),
      createdAt: new Date(),
      name: 'Player2',
      role: 'USER',
      updatedAt: new Date(),
      status: 'WAITING'
    },
  ],
};

const mockMatchDetails: MatchDetails = {
  id: 'match123',
  host: 'user123',
  guest: 'user456',
  level: 1,
  map: 'default',
  started: false,
};

describe('MatchRepositoryPostgres', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  let matchRepository: MatchRepositoryPostgres;

  beforeEach(() => {
    vi.clearAllMocks();
    matchRepository = new MatchRepositoryPostgres(mockPrisma);
  });

  describe('getMatchById', () => {
    it('should return match details when match is found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      const result = await matchRepository.getMatchById('match123');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match123' },
        include: { players: true },
      });
      expect(result).toEqual(mockMatchDetails);
    });

    it('should throw error when match is not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(matchRepository.getMatchById('match123')).rejects.toThrow(MatchError);
      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match123' },
        include: { players: true },
      });
    });

    it('should throw error when host player is not found', async () => {
      const matchWithoutHost = {
        ...mockMatch,
        players: mockMatch.players.filter((p) => p.playerRole !== 'HOST'),
      };
      mockPrisma.match.findUnique.mockResolvedValue(matchWithoutHost);

      await expect(matchRepository.getMatchById('match123')).rejects.toThrow(MatchError);
    });
  });

  describe('extendSession', () => {
    it('should update match expiration time', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      await matchRepository.extendSession('match123', 10);

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
      expect(mockPrisma.match.update).toHaveBeenCalled();
      const updateCall = mockPrisma.match.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: 'match123' });
      expect(updateCall.data.expiredAt).toBeInstanceOf(Date);
    });

    it('should throw error when match not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(matchRepository.extendSession('match123', 10)).rejects.toThrow(MatchError);
      expect(mockPrisma.match.update).not.toHaveBeenCalled();
    });
  });

  describe('removeMatch', () => {
    it('should delete match when found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(mockMatch);

      await matchRepository.removeMatch('match123');

      expect(mockPrisma.match.findUnique).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
      expect(mockPrisma.match.delete).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
    });

    it('should throw error when match not found', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);

      await expect(matchRepository.removeMatch('match123')).rejects.toThrow(MatchError);
      expect(mockPrisma.match.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateMatch', () => {
    it('should update match data correctly', async () => {
      mockPrisma.match.count.mockResolvedValue(1);
      const matchData: Partial<MatchDetails> = {
        level: 2,
        map: 'snow',
        started: true,
      };

      await matchRepository.updateMatch('match123', matchData);

      expect(mockPrisma.match.count).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
      expect(mockPrisma.match.update).toHaveBeenCalledWith({
        where: { id: 'match123' },
        data: {
          level: 2,
          map: 'snow',
          started: true,
        },
      });
    });

    it('should throw error when match not found', async () => {
      mockPrisma.match.count.mockResolvedValue(0);

      await expect(matchRepository.updateMatch('match123', { level: 2 })).rejects.toThrow(
        MatchError
      );
      expect(mockPrisma.match.update).not.toHaveBeenCalled();
    });
  });

  describe('createMatch', () => {
    it('should create a match with expiration time', async () => {
      await matchRepository.createMatch(mockMatchDetails);

      expect(mockPrisma.match.create).toHaveBeenCalledWith({
        data: {
          id: 'match123',
          level: 1,
          map: 'default',
          started: false,
          expiredAt: expect.any(Date),
        },
      });
    });
  });

  describe('matchExists', () => {
    it('should return true when match exists', async () => {
      mockPrisma.match.count.mockResolvedValue(1);

      const result = await matchRepository.matchExists('match123');

      expect(mockPrisma.match.count).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
      expect(result).toBe(true);
    });

    it('should return false when match does not exist', async () => {
      mockPrisma.match.count.mockResolvedValue(0);

      const result = await matchRepository.matchExists('match123');

      expect(mockPrisma.match.count).toHaveBeenCalledWith({
        where: { id: 'match123' },
      });
      expect(result).toBe(false);
    });
  });
});