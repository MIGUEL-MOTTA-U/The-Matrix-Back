import MatchMaking from '../../../src/app/lobbies/services/MatchmakingImpl.js';
import type WebSocketService from '../../../src/app/lobbies/services/WebSocketService.js';
import type MatchRepository from '../../../src/schemas/MatchRepository.js';
import type UserRepository from '../../../src/schemas/UserRepository.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, } from 'vitest-mock-extended';
import type { MatchDetails } from '../../../src/schemas/zod.js';
import type GameService from '../../../src/app/game/services/GameService.js';
const matchRepository = mockDeep<MatchRepository>();
const userRepository = mockDeep<UserRepository>();
const webSocketService = mockDeep<WebSocketService>();
const gameService = mockDeep<GameService>();
 vi.mock('../../../src/server.js', () => ({
     logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
 }));
beforeEach(() => {
  vi.clearAllMocks();
});

describe('MatchMaking', () => {
    let matchMaking: MatchMaking;
  
    beforeEach(() => {
      matchMaking = new MatchMaking(
        matchRepository,userRepository, webSocketService, gameService)
    });
  
    it('should enqueue a user if no match is found', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 0,
          map: ''
      };
  
      await matchMaking.searchMatch(matchDetails);
  
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
      expect(matchRepository.extendSession).not.toHaveBeenCalled();
    });
  
    it('should create a match if a host is found in the queue', async () => {
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user2',
          level: 0,
          map: ''
      };
  
      const host = { id: 'user1', matchId: 'match2' };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      vi.spyOn(matchMaking['queue'], 'dequeue').mockResolvedValue(host);
  
      await matchMaking.searchMatch(matchDetails);
  
      expect(matchRepository.updateMatch).toHaveBeenCalledWith('match2', { host: 'user1', guest: 'user2' });
      expect(webSocketService.notifyMatchFound).toHaveBeenCalled();
      expect(matchRepository.extendSession).toHaveBeenCalledWith('match2', 10);
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
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      await matchMaking['createMatch'](matchDetails);
  
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled(); // Ensure no notification is sent here
    });
  
    it('should log an error if queue dequeue fails', async () => {
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      vi.spyOn(matchMaking['queue'], 'dequeue').mockRejectedValue(new Error('Queue error'));
  
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 0,
          map: ''
      };
  
      await expect(matchMaking.searchMatch(matchDetails)).rejects.toThrow('Queue error');
    });
    
    it('should handle empty queue gracefully', async () => {
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      vi.spyOn(matchMaking['queue'], 'dequeue').mockResolvedValue(undefined);
  
      const matchDetails: MatchDetails = {
          id: 'match1',
          host: 'user1',
          level: 0,
          map: ''
      };
  
      await matchMaking.searchMatch(matchDetails);
  
      expect(matchRepository.updateMatch).not.toHaveBeenCalled();
      expect(webSocketService.notifyMatchFound).not.toHaveBeenCalled();
    });
  });