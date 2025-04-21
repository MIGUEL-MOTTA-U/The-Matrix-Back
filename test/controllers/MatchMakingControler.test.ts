import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MatchMakingController from '../../src/controllers/websockets/MatchMakingController.js';
import WebsocketService from '../../src/app/lobbies/services/WebSocketServiceImpl.js';
import { validateString, validateMatchDetails, } from '../../src/schemas/zod.js';
import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { mockDeep } from 'vitest-mock-extended';
import type UserRepository from '../../src/schemas/UserRepository.js';
import type MatchRepository from '../../src/schemas/MatchRepository.js';
import type MatchMakingService from '../../src/app/lobbies/services/MatchMakingService.js';
import { logger } from '../../src/server.js';


vi.mock('../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/app/lobbies/services/WebSocketServiceImpl.js', () => {
  const mockInstance = {
    registerConnection: vi.fn(),
    matchMaking: vi.fn(),
    removeConnection: vi.fn(),
  };
  return {
    default: {
      getInstance: vi.fn(() => mockInstance),
    },
  };
});

vi.mock('../../src/schemas/zod.js', () => ({
  validateString: vi.fn((input) => input),
  validateMatchDetails: vi.fn((input) => input),
  validateInfo: vi.fn((input) => input),
  validateErrorMatch: vi.fn((input) => input),
}));

const userRepository = mockDeep<UserRepository>();
const matchRepository = mockDeep<MatchRepository>();
const matchMakingService = mockDeep<MatchMakingService>();
const mockWebSocketService = WebsocketService.getInstance(matchMakingService, matchRepository);
const controller = MatchMakingController.getInstance(
  mockWebSocketService,
  matchRepository,
  userRepository
);

describe('MatchMakingController', () => {
  type MockWebSocket = {
    send: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  let mockSocket: MockWebSocket;
  let mockRequest: FastifyRequest;
  let messageHandler: ((message: Buffer) => void) | undefined;
  let closeHandler: (() => void) | undefined;

  const validMatchDetails = {
    id: 'match123',
    host: 'user123',
    guest: null,
    level: 2,
    map: 'desert',
    started: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    messageHandler = undefined;
    closeHandler = undefined;

    mockSocket = {
      send: vi.fn(),
      on: vi.fn((event: string, handler: (message: Buffer | Error) => undefined | (() => void)) => {
        if (event === 'message') messageHandler = handler as (message: Buffer) => void;
        if (event === 'close') closeHandler = handler as () => void;
        return mockSocket as unknown as WebSocket;
      }),
      close: vi.fn(),
    };

    mockRequest = {
      params: { matchId: 'match123' },
    } as unknown as FastifyRequest;

    matchRepository.getMatchById.mockResolvedValue(validMatchDetails);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = MatchMakingController.getInstance(mockWebSocketService, matchRepository, userRepository);
      const instance2 = MatchMakingController.getInstance(mockWebSocketService, matchRepository, userRepository);
      expect(instance1).toBe(instance2);
    });
  });

  describe('handleMatchMaking', () => {
    it('should register connection, send initial message, and setup event listeners', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      expect(validateString).toHaveBeenCalledWith('match123');
      expect(mockWebSocketService.registerConnection).toHaveBeenCalledWith('user123', mockSocket);
      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ message: 'Connected and looking for a match...' }));
      expect(mockWebSocketService.matchMaking).toHaveBeenCalledWith(validMatchDetails);
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle errors and close socket when exception occurs', async () => {
      matchRepository.getMatchById.mockRejectedValue(new Error('Database error'));
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should respond with progress message on message event', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      if (messageHandler) {
        messageHandler(Buffer.from('any message'));
        expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ message: 'Matchmaking in progress...' }));
      } else {
        throw new Error('Message handler not registered');
      }
    });

    it('should remove connection on close event', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      if (closeHandler) {
        closeHandler();
        expect(mockWebSocketService.removeConnection).toHaveBeenCalledWith('user123');
      } else {
        throw new Error('Close handler not registered');
      }
    });

    it('should log error on socket error event', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      const error = new Error('Socket error');
      if (closeHandler) {
        mockSocket.on.mock.calls.find(([event]) => event === 'error')?.[1](error);
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(error);
      } else {
        throw new Error('Error handler not registered');
      }
    });

    it('should throw MatchError if match is already started', async () => {
      matchRepository.getMatchById.mockResolvedValue({ ...validMatchDetails, started: true });

      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(JSON.stringify({ error: 'Internal server error' }));
      expect(mockSocket.close).toHaveBeenCalled();
    });
  });
});