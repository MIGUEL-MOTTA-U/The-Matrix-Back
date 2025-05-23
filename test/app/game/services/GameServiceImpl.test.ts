import type UserRepository from '../../../../src/schemas/UserRepository.js';
import type MatchRepository from '../../../../src/schemas/MatchRepository.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { WebSocket } from 'ws';
import GameServiceImpl from '../../../../src/app/game/services/GameServiceImpl.js';
import type { MatchStorage, MatchDetails, PlayerMove, UpdateEnemy, UpdateTime } from '../../../../src/schemas/zod.js';
import type Match from '../../../../src/app/game/match/Match.js';
import type GameCacheRedis from '../../../../src/schemas/repositories/GameCacheRedis.js';
import SocketConnections from '../../../../src/app/shared/SocketConnectionsServiceImpl.js';

vi.mock('../../../../src/server.js', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
    config: {},
  };
});
const connections = new SocketConnections();
const matchRepository = mockDeep<MatchRepository>();
const userRepository = mockDeep<UserRepository>();
const gameCache = mockDeep<GameCacheRedis>();
gameCache.getMatch.mockResolvedValue(null);
gameCache.saveMatch.mockResolvedValue(undefined);
const gameServiceImpl = new GameServiceImpl(matchRepository, userRepository, gameCache, connections);
beforeEach(() => {
  vi.clearAllMocks();
  connections.clearConnections();
});

describe('GameServiceImpl', () => {
  describe('extendUsersSession', () => {
    it('should extend the session of a user', async () => {
      const userId = 'user1';

      await gameServiceImpl.extendUsersSession(userId);

      expect(userRepository.extendSession).toHaveBeenCalledWith(userId, 20);
    });
  });

  describe('extendMatchSession', () => {
    it('should extend the session of a match', async () => {
      const matchId = 'match1';

      await gameServiceImpl.extendMatchSession(matchId);

      expect(matchRepository.extendSession).toHaveBeenCalledWith(matchId, 20);
    });
  });

  describe('handleGameMessage', () => {
    it('should throw an error if match is not found', async () => {
      const userId = 'user1';
      const matchId = 'invalidMatchId';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'up' }));

      await expect(gameServiceImpl.handleGameMessage(userId, matchId, message)).rejects.toThrow(
        'The requested match was not found'
      );
    });

    it('should throw an error if player is not found', async () => {
      const userId = 'user1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'up' }));
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(undefined),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      await expect(gameServiceImpl.handleGameMessage(userId, matchId, message)).rejects.toThrow(
        'The requested player was not found'
      );
    });

    it('should move up', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'up' }));
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        moveUp: vi.fn().mockResolvedValue({ id: 'host1', position: { x: 0, y: 1 } }),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);

      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.moveUp).toHaveBeenCalled();
      expect(mockSocketP1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
      expect(mockSocketP2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
    });

    it('should move down', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'down' }));
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        moveDown: vi.fn().mockResolvedValue({ id: 'host1', position: { x: 0, y: 1 } }),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);

      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.moveDown).toHaveBeenCalled();
      expect(mockSocketP1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
      expect(mockSocketP2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
    });

    it('should move right', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'right' }));
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        moveRight: vi.fn().mockResolvedValue({ id: 'host1', position: { x: 0, y: 1 } }),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);
      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.moveRight).toHaveBeenCalled();
      expect(mockSocketP1.send).toHaveBeenCalledWith(
        JSON.stringify({type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
      expect(mockSocketP2.send).toHaveBeenCalledWith(
        JSON.stringify({type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
    });

    it('should move Left', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'movement', payload: 'left' }));
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        moveLeft: vi.fn().mockResolvedValue({ id: 'host1', position: { x: 0, y: 1 } }),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);
      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.moveLeft).toHaveBeenCalled();
      expect(mockSocketP1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
      expect(mockSocketP2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-move', payload: { id: 'host1', position: { x: 0, y: 1 } }})
      );
    });

    it('should rotate up', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'rotate', payload: 'up' }));
      const mockPalyerUpdate: PlayerMove = {
        id: 'host1',
        coordinates: { x: 0, y: 1 },
        direction: 'up',
        state: 'alive',
      };
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        changeOrientation: vi.fn().mockReturnValue(mockPalyerUpdate),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);
      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.changeOrientation).toHaveBeenCalled();
    });

    it('should rotate down', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'rotate', payload: 'down' }));
      const mockPalyerUpdate: PlayerMove = {
        id: 'host1',
        coordinates: { x: 0, y: 1 },
        direction: 'down',
        state: 'alive',
      };
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        changeOrientation: vi.fn().mockReturnValue(mockPalyerUpdate),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);

      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.changeOrientation).toHaveBeenCalled();
    });

    it('should rotate left', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'rotate', payload: 'left' }));
      const mockPalyerUpdate: PlayerMove = {
        id: 'host1',
        coordinates: { x: 0, y: 1 },
        direction: 'left',
        state: 'alive',
      };
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        changeOrientation: vi.fn().mockReturnValue(mockPalyerUpdate),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);

      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.changeOrientation).toHaveBeenCalled();
    });

    it('should rotate right', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'rotate', payload: 'right' }));
      const mockPalyerUpdate: PlayerMove = {
        id: 'host1',
        coordinates: { x: 0, y: 1 },
        direction: 'right',
        state: 'alive',
      };
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        changeOrientation: vi.fn().mockReturnValue(mockPalyerUpdate),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);

      await gameServiceImpl.handleGameMessage(userId, matchId, message);

      expect(mockPlayer.changeOrientation).toHaveBeenCalled();
    });

    it('should handle exec-power message and notify players with frozen cells', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'exec-power', payload: '' }));
      
      const frozenCells = [
        { 
          coordinates: { x: 5, y: 5 }, 
          item: null,
          character: null,
          frozen: true,
        }
      ];
      
      const playerDirection = 'up';
      
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        execPower: vi.fn().mockResolvedValue(frozenCells),
        getOrientation: vi.fn().mockReturnValue(playerDirection),
        getId: vi.fn().mockReturnValue(userId)
      };
      
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        checkLose: vi.fn().mockReturnValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['gameFinished'] = vi.fn().mockReturnValue(false);
      
      await gameServiceImpl.handleGameMessage(userId, matchId, message);
      
      expect(mockPlayer.execPower).toHaveBeenCalled();
      expect(mockPlayer.getOrientation).toHaveBeenCalled();
      
      const expectedPayload = { 
        cells: frozenCells, 
        direction: playerDirection 
      };
      
      expect(mockSocketP1.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-frozen-cells', payload: expectedPayload })
      );
      
      expect(mockSocketP2.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'update-frozen-cells', payload: expectedPayload })
      );
    });

    it('Should fail with an error with unsupported message', async () => {
      const userId = 'host1';
      const matchId = 'match1';
      const message = Buffer.from(JSON.stringify({ type: 'unsupported message', payload: 'up' }));
      const mockPlayer = {
        isAlive: vi.fn().mockReturnValue(true),
        moveUp: vi.fn().mockResolvedValue({ id: 'host1', position: { x: 0, y: 1 } }),
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getPlayer: vi.fn().mockReturnValue(mockPlayer),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockResolvedValue(false),
        stopGame: vi.fn(),
        getId: vi.fn().mockReturnValue(matchId),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('host1', mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection('guest1', mockSocketP2 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['validateMessage'] = vi.fn().mockReturnValue({
        type: 'unsupported message',
        payload: 'up',
        gameMatch: mockMatch,
        player: mockPlayer,
      });

      await expect(gameServiceImpl.handleGameMessage(userId, matchId, message)).rejects.toThrow(
        'The message type is invalid'
      );
    });
  });

  

  describe('updatePlayers', () => {
    it('should update players with the given data', async () => {
      const matchId = 'match1';
      const hostId = 'host1';
      const guestId = 'guest1';
      const data: UpdateEnemy = {
        enemyId: 'enemy1',
        coordinates: { x: 5, y: 5 },
        direction: 'up',
        enemyState: 'walking'
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        isRunning: vi.fn().mockReturnValue(true),
        checkLose: vi.fn().mockReturnValue(false),
        checkWin: vi.fn().mockReturnValue(false),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      const mockSocketP1 = { send: vi.fn(), readyState: WebSocket.OPEN };
      const mockSocketP2 = { send: vi.fn(), readyState: WebSocket.OPEN };

      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection(hostId, mockSocketP1 as unknown as WebSocket);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection(guestId, mockSocketP2 as unknown as WebSocket);

      await gameServiceImpl.updatePlayers(matchId, hostId, guestId, { type: 'update-enemy', payload: data });

      expect(mockSocketP1.send).toHaveBeenCalledWith(JSON.stringify({ type: 'update-enemy', payload: data }));
      expect(mockSocketP2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'update-enemy', payload: data }));
    });

    it('should throw an error if match is not found', async () => {
      const matchId = 'invalidMatchId';
      const hostId = 'host1';
      const guestId = 'guest1';
      const data: UpdateEnemy = {
        enemyId: 'enemy1',
        coordinates: { x: 5, y: 5 },
        direction: 'up',
        enemyState: 'walking'
      };

      await expect(gameServiceImpl.updatePlayers(matchId, hostId, guestId, {type: 'update-enemy' , payload: data})).rejects.toThrow(
        'The requested match was not found'
      );
    });
  });

  describe('checkMatchDetails', () => {
    it('should throw an error if host and guest are the same', () => {
      const matchDetails = { host: 'player1', guest: 'player1', started: true };

      expect(() =>
        gameServiceImpl.checkMatchDetails(matchDetails as unknown as MatchDetails)
      ).toThrow('The match cannot start');
    });

    it('should throw an error if host or guest is missing', () => {
      const matchDetails = { host: '', guest: 'player2', started: true };

      expect(() =>
        gameServiceImpl.checkMatchDetails(matchDetails as unknown as MatchDetails)
      ).toThrow('The match cannot start');
    });

    it('should throw an error if match has not started', () => {
      const matchDetails = { host: 'player1', guest: 'player2', started: false };

      expect(() =>
        gameServiceImpl.checkMatchDetails(matchDetails as unknown as MatchDetails)
      ).toThrow('The match cannot start');
    });
  });

  describe('registerConnection', () => {
    it('should register a new connection and return false if user was not connected', () => {
      const user = 'user1';
      const socket = { readyState: WebSocket.OPEN };

      const result = gameServiceImpl.registerConnection(user, socket as unknown as WebSocket);

      expect(result).toBe(false);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl['connections'].getConnection(user)).toBe(socket);
    });

    it('should update an existing connection and return true if user was already connected', () => {
      const user = 'user1';
      const oldSocket = { readyState: WebSocket.OPEN, close: vi.fn() };
      const newSocket = { readyState: WebSocket.OPEN, close: vi.fn() };

      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection(user, oldSocket as unknown as WebSocket);

      const result = gameServiceImpl.registerConnection(user, newSocket as unknown as WebSocket);

      expect(result).toBe(true);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl['connections'].getConnection(user)).toBe(newSocket);
    });
  });

  describe('removeConnection', () => {
    it('should remove a user connection', () => {
      const user = 'user1';
      const socket = { readyState: WebSocket.OPEN, close: vi.fn() };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['connections'].registerConnection(user, socket as unknown as WebSocket);

      gameServiceImpl.removeConnection(user);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl['connections'].isConnected(user)).toBe(false);
    });
  });

  describe('Update Time Match', () => {
    it('should update the time of the match', async () => {
      const matchId = 'match1';
      const time: UpdateTime = {
        minutesLeft: 1000,
        secondsLeft: 50,
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getId: vi.fn().mockReturnValue(matchId),
        setTime: vi.fn(),
        isRunning: vi.fn().mockReturnValue(true),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        checkWin: vi.fn().mockReturnValue(false),
        checkLose: vi.fn().mockReturnValue(false),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      type GameServiceImplWithPrivateMethods = typeof gameServiceImpl & {
        notifyPlayers: (
          matchId: string,
          hostId: string,
          guestId: string,
          data: unknown
        ) => Promise<void>;
      };
      const notifyPlayersSpy = vi.spyOn(
        gameServiceImpl as GameServiceImplWithPrivateMethods,
        'notifyPlayers'
      );

      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);
      await gameServiceImpl.updateTimeMatch(matchId, time);

      expect(mockMatch.checkWin).toHaveBeenCalled();
      expect(mockMatch.checkLose).toHaveBeenCalled();
      expect(notifyPlayersSpy).toHaveBeenCalled();
    });
  });

  describe('Create Match', () => {
    it('should create a match and return its ID', async () => {
      const hostId = 'host1';
      const guestId = 'guest1';
      const matchDetails: MatchDetails = {
        id: 'matchId',
        host: hostId,
        guest: guestId,
        started: true,
        level: 1,
        map: 'map - test',
      };
      // Mock the Match class

      const mockMatch = mockDeep<Match>();
      vi.doMock('../../../../src/app/game/match/Match.js', () => {
        return {
          default: vi.fn().mockReturnValue(mockMatch),
        };
      });
      // Cuándo lo intenta crear salta el error
      const matchId = await gameServiceImpl.createMatch(matchDetails);

      expect(matchId).toBeDefined();
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl['matches'].has(matchId.getId())).toBe(true);
    });

    it('should throw an error if the guest is not defined', async () => {
      const hostId = 'host1';
      const guestId = undefined;
      const matchDetails: MatchDetails = {
        id: 'matchId',
        host: hostId,
        guest: guestId,
        started: true,
        level: 1,
        map: 'map - test',
      };
      await expect(gameServiceImpl.createMatch(matchDetails)).rejects.toThrow(
        'The match cannot be created'
      );
    });
  });
  describe('getMatch', () => {
    it('should return a match by its ID', async () => {
      const matchId = 'match1';
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false), id: matchId };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      const result = await gameServiceImpl.getMatch(matchId);

      expect(result).toBe(mockMatch);
    });
    it('should return undefined if the match is not found', async () => {
      const matchId = 'invalidMatchId';

      const result = await gameServiceImpl.getMatch(matchId);
      expect(gameCache.getMatch).toHaveBeenCalledWith(matchId);
      expect(result).toBeUndefined();
    });
  });

  describe('get match update', () => {
    it('should return the match update', async () => {
      const matchId = 'match1';
      const matchUpdate = {
        id: matchId,
        host: 'host1',
        guest: 'guest1',
        running: true,
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getId: vi.fn().mockReturnValue(matchId),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        isRunning: vi.fn().mockReturnValue(true),
        checkWin: vi.fn().mockReturnValue(false),
        checkLose: vi.fn().mockReturnValue(false),
        getMatchUpdate: vi.fn().mockReturnValue(matchUpdate),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      const result = await gameServiceImpl.getMatchUpdate(matchId);

      expect(result).toEqual(matchUpdate);
    });

    it('should throw error if the match is not found', async () => {
      const matchId = 'invalidMatchId';

      await expect(gameServiceImpl.getMatchUpdate(matchId)).rejects.toThrow(
        'The requested match was not found'
      );
    });
  });

  describe('updateTime', () => {
    it('should update the time of the match', async () => {
      const matchId = 'match1';
      const time: UpdateTime = {
        minutesLeft: 1000,
        secondsLeft: 50,
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getId: vi.fn().mockReturnValue(matchId),
        setTime: vi.fn(),
        isRunning: vi.fn().mockReturnValue(true),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        checkWin: vi.fn().mockReturnValue(false),
        checkLose: vi.fn().mockReturnValue(false),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      await gameServiceImpl.updateTimeMatch(matchId, time);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl["notifyPlayers"]).toHaveBeenCalled();
      expect(mockMatch.checkWin).toHaveBeenCalled();
      expect(mockMatch.checkLose).toHaveBeenCalled();
    });

    it('should throw error if the match is not found', async () => {
      const matchId = 'invalidMatchId';
      const time: UpdateTime = {
        minutesLeft: 1000,
        secondsLeft: 50,
      };

      await expect(gameServiceImpl.updateTimeMatch(matchId, time)).rejects.toThrow(
        'The requested match was not found'
      );
    });

    it('should notify if they loose', async () => {
      const matchId = 'match1';
      const time: UpdateTime = {
        minutesLeft: 1000,
        secondsLeft: 50,
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getId: vi.fn().mockReturnValue(matchId),
        setTime: vi.fn(),
        isRunning: vi.fn().mockReturnValue(true),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        checkWin: vi.fn().mockReturnValue(false),
        checkLose: vi.fn().mockReturnValue(true),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      await gameServiceImpl.updateTimeMatch(matchId, time);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl["notifyPlayers"]).toHaveBeenCalled();
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl["notifyPlayers"]).toHaveBeenCalledTimes(2);
    })

    it('should notify if they win', async () => {
      const matchId = 'match1';
      const time: UpdateTime = {
        minutesLeft: 1000,
        secondsLeft: 50,
      };
      const mockMatch = {
        isPaused: vi.fn().mockResolvedValue(false),
        getId: vi.fn().mockReturnValue(matchId),
        setTime: vi.fn(),
        isRunning: vi.fn().mockReturnValue(true),
        getHost: vi.fn().mockReturnValue('host1'),
        getGuest: vi.fn().mockReturnValue('guest1'),
        checkWin: vi.fn().mockReturnValue(true),
        checkLose: vi.fn().mockReturnValue(false),
        getMatchStorage: vi.fn().mockResolvedValue({
          id: matchId,
          level: 1,
          map: 'test-map',
          timeSeconds: 300,
          typeFruits: [],
          host: { id: 'host1' },
          guest: { id: 'guest1' },
          board: {},
        }),
      };
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      gameServiceImpl['matches'].set(matchId, mockMatch as unknown as Match);

      await gameServiceImpl.updateTimeMatch(matchId, time);
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl["notifyPlayers"]).toHaveBeenCalled();
      // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
      expect(gameServiceImpl["notifyPlayers"]).toHaveBeenCalledTimes(2);
      expect(mockMatch.checkLose).not.toHaveBeenCalled();
    });
  })

  describe('save match', () => {
    it('should save the match', async () => {
      const matchId = 'match1';
      const matchStorage = {
        id: matchId,
        level: 1,
        map: 'test-map',
        timeSeconds: 300,
        typeFruits: [],
        host: { id: 'host1' },
        guest: { id: 'guest1' },
        board: {},
      } as unknown as MatchStorage;
      await gameServiceImpl.saveMatch(matchId,matchStorage);
      expect(gameCache.saveMatch).toHaveBeenCalledWith(matchId, matchStorage);
    });
  })
});