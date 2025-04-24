import MatchMaking from '../../../src/app/lobbies/services/MatchmakingImpl.js';
import type WebSocketService from '../../../src/app/lobbies/services/WebSocketService.js';
import type MatchRepository from '../../../src/schemas/MatchRepository.js';
import type UserRepository from '../../../src/schemas/UserRepository.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type { MatchDetails } from '../../../src/schemas/zod.js';
import type GameService from '../../../src/app/game/services/GameService.js';
import AsyncQueue from '../../../src/utils/AsyncQueue.js';
import type Match from '../../../src/app/game/match/Match.js';

const matchRepository = mockDeep<MatchRepository>();
const userRepository = mockDeep<UserRepository>();
const webSocketService = mockDeep<WebSocketService>();
const gameService = mockDeep<GameService>();

vi.mock('../../../src/server.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

describe('MatchMaking', () => {
    let matchMaking: MatchMaking;
  
    beforeEach(() => {
      vi.clearAllMocks();
      matchMaking = new MatchMaking(
        matchRepository, userRepository, webSocketService, gameService);
    });
  
    it('should enqueue a user if no queue exists for the map/level combination', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 1,
          map: 'desert'
      };
      
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      const mockGet = vi.spyOn(matchMaking['queue'], 'get').mockReturnValue(undefined);
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      const mockAdd = vi.spyOn(matchMaking['queue'], 'add').mockImplementation(vi.fn());
      
      await matchMaking.searchMatch(matchDetails);
      
      expect(mockGet).toHaveBeenCalledWith({ map: 'desert', level: 1 });
      expect(mockAdd).toHaveBeenCalled();
      
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
    });
  
    it('should create a match if a host is found in the queue', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user2',
          level: 2,
          map: 'forest'
      };
      
      const mockQueue = new AsyncQueue<{ id: string; matchId: string }>();
      vi.spyOn(mockQueue, 'dequeue').mockResolvedValue({ id: 'user1', matchId: 'match2' });
      
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      vi.spyOn(matchMaking['queue'], 'get').mockReturnValue(mockQueue);
      
      const mockMatch = { id: 'match2' };
      gameService.createMatch.mockResolvedValue(mockMatch as unknown as Match);
      
      await matchMaking.searchMatch(matchDetails);
      
      expect(matchRepository.updateMatch).toHaveBeenCalledWith('match2', { host: 'user1', guest: 'user2' });
      expect(webSocketService.notifyMatchFound).toHaveBeenCalledWith(mockMatch, 'match1');
      expect(matchRepository.extendSession).toHaveBeenCalledWith('match2', 10);
    });
  
    it('should enqueue user if queue exists but is empty', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 3,
          map: 'snow'
      };
      
      const mockQueue = new AsyncQueue<{ id: string; matchId: string }>();
      vi.spyOn(mockQueue, 'dequeue').mockResolvedValue(undefined);
      vi.spyOn(mockQueue, 'enqueue').mockResolvedValue(undefined);
      
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      vi.spyOn(matchMaking['queue'], 'get').mockReturnValue(mockQueue);
      
      await matchMaking.searchMatch(matchDetails);
      
      expect(mockQueue.enqueue).toHaveBeenCalledWith({ id: 'user1', matchId: 'match1' });
      
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
    });
  
    it('should handle case when user matches with themselves', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 4,
          map: 'jungle'
      };
      const mockQueue = new AsyncQueue<{ id: string; matchId: string }>();
      vi.spyOn(mockQueue, 'dequeue').mockResolvedValue({ id: 'user1', matchId: 'different-match' });
      vi.spyOn(mockQueue, 'enqueue').mockResolvedValue(undefined);
      
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      vi.spyOn(matchMaking['queue'], 'get').mockReturnValue(mockQueue);
      
      await matchMaking.searchMatch(matchDetails);

      expect(mockQueue.enqueue).toHaveBeenCalledWith({ id: 'user1', matchId: 'match1' });
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
    });
    
    it('should throw an error when cancelMatchMaking is called', () => {
      expect(() => matchMaking.cancelMatchMaking('user1')).toThrow('Method not implemented.');
    });
  
    it('should update a match correctly', async () => {
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      await matchMaking['updateMatch']('match1', 'host1', 'guest1');
  
      expect(matchRepository.updateMatch).toHaveBeenCalledWith('match1', { host: 'host1', guest: 'guest1' });
      expect(matchRepository.extendSession).toHaveBeenCalledWith('match1', 10);
    });
  
    it('should update a user correctly', async () => {
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      await matchMaking['updateUser']('user1', 'match1');
  
      expect(userRepository.updateUser).toHaveBeenCalledWith('user1', { matchId: 'match1' });
      expect(userRepository.extendSession).toHaveBeenCalledWith('user1', 10);
    });
  
    it('should create a match correctly', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 0,
          map: ''
      };
      
      const mockMatch = { id: 'match1' };
      gameService.createMatch.mockResolvedValue(mockMatch as unknown as Match);
      
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      const result = await matchMaking['createMatch'](matchDetails);
  
      expect(result).toEqual(mockMatch);
      expect(gameService.createMatch).toHaveBeenCalledWith(matchDetails);
    });
  
    it('should handle error if queue operation fails', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 5,
          map: 'cave'
      };
      
      const mockQueue = new AsyncQueue<{ id: string; matchId: string }>();
      vi.spyOn(mockQueue, 'dequeue').mockRejectedValue(new Error('Queue error'));
      
      // biome-ignore lint/complexity/useLiteralKeys: For Testing purposes
      vi.spyOn(matchMaking['queue'], 'get').mockReturnValue(mockQueue);
      
      await expect(matchMaking.searchMatch(matchDetails)).rejects.toThrow('Queue error');
      
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
    });
  }); 