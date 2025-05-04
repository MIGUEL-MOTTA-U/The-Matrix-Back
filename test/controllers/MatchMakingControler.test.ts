import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import MatchMakingController from '../../src/controllers/websockets/MatchMakingController.js';
import WebsocketServiceImpl from '../../src/app/lobbies/services/WebSocketServiceImpl.js';
import { validateString, validateMatchDetails } from '../../src/schemas/zod.js';
import type { FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { mockDeep } from 'vitest-mock-extended';
import type UserRepository from '../../src/schemas/UserRepository.js';
import type MatchRepository from '../../src/schemas/MatchRepository.js';
import type MatchMakingService from '../../src/app/lobbies/services/MatchMakingService.js';
import { logger } from '../../src/server.js';
import type WebSocketService from '../../src/app/lobbies/services/WebSocketService.js';

vi.mock('../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/schemas/zod.js', () => ({
  validateString: vi.fn((input) => input),
  validateMatchDetails: vi.fn((input) => input),
  validateInfo: vi.fn((input) => input),
  validateErrorMatch: vi.fn((input) => input),
  validateGameMessageOutput: vi.fn((input) => input),
}));

const userRepository = mockDeep<UserRepository>();
const matchRepository = mockDeep<MatchRepository>();
const matchMakingService = mockDeep<MatchMakingService>();
const mockWebSocketService: WebSocketService = new WebsocketServiceImpl(matchRepository);
mockWebSocketService.setMatchMakingService(matchMakingService);
mockWebSocketService.registerConnection = vi.fn();
mockWebSocketService.matchMaking = vi.fn();
mockWebSocketService.removeConnection = vi.fn();
mockWebSocketService.joinGame = vi.fn();
const controller = new MatchMakingController(mockWebSocketService, matchRepository, userRepository);

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

  describe('handleMatchMaking', () => {
    it('should register connection, send initial message, and setup event listeners', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      expect(validateString).toHaveBeenCalledWith('match123');
      expect(mockWebSocketService.registerConnection).toHaveBeenCalledWith('user123', mockSocket);
      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ message: 'Connected and looking for a match...' })
      );
      expect(mockWebSocketService.matchMaking).toHaveBeenCalledWith(validMatchDetails);
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle errors and close socket when exception occurs', async () => {
      matchRepository.getMatchById.mockRejectedValue(new Error('Database error'));
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should respond with progress message on message event', async () => {
      await controller.handleMatchMaking(mockSocket as unknown as WebSocket, mockRequest);

      if (messageHandler) {
        messageHandler(Buffer.from('any message'));
        expect(mockSocket.send).toHaveBeenCalledWith(
          JSON.stringify({ message: 'Matchmaking in progress...' })
        );
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

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });
  });

  describe('handlePublishMatch', () => {
    beforeEach(() => {
      mockRequest = {
        params: { matchId: 'match123', userId: 'user123' },
      } as unknown as FastifyRequest;

      userRepository.getUserById.mockResolvedValue({ id: 'user123', matchId: 'match123' });
      mockWebSocketService.validateMatchToPublish = vi.fn().mockResolvedValue(undefined);
      mockWebSocketService.publishMatch = vi.fn();
      mockWebSocketService.removePublishedMatch = vi.fn();
    });

    it('should publish a match successfully', async () => {
      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      expect(validateString).toHaveBeenCalledWith('match123');
      expect(validateString).toHaveBeenCalledWith('user123');
      expect(mockWebSocketService.validateMatchToPublish).toHaveBeenCalledWith(
        'match123',
        'user123'
      );
      expect(mockWebSocketService.publishMatch).toHaveBeenCalledWith('match123', mockSocket);
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle error when host ID does not match match host', async () => {
      const mismatchedMatch = { ...validMatchDetails, host: 'differentUser' };
      matchRepository.getMatchById.mockResolvedValue(mismatchedMatch);

      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should handle errors from validateMatchToPublish', async () => {
      mockWebSocketService.validateMatchToPublish = vi
        .fn()
        .mockRejectedValue(new Error('Match validation failed'));

      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should send success message on message event', async () => {
      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      const messageHandler = mockSocket.on.mock.calls.find(([event]) => event === 'message')?.[1];
      if (messageHandler) {
        messageHandler(Buffer.from('any message'));
        expect(mockSocket.send).toHaveBeenCalledWith(
          JSON.stringify({ message: 'Match published successfully!' })
        );
        expect(matchRepository.extendSession).toHaveBeenCalledWith('match123', 10);
      } else {
        throw new Error('Message handler not registered');
      }
    });

    it('should remove published match on close event', async () => {
      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      const closeHandler = mockSocket.on.mock.calls.find(([event]) => event === 'close')?.[1];
      if (closeHandler) {
        closeHandler();
        expect(mockWebSocketService.removePublishedMatch).toHaveBeenCalledWith('match123');
      } else {
        throw new Error('Close handler not registered');
      }
    });

    it('should handle error on socket error event', async () => {
      await controller.handlePublishMatch(mockSocket as unknown as WebSocket, mockRequest);

      const errorHandler = mockSocket.on.mock.calls.find(([event]) => event === 'error')?.[1];
      if (errorHandler) {
        const error = new Error('Socket error');
        errorHandler(error);
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(error);
        expect(mockSocket.send).toHaveBeenCalled();
        expect(mockSocket.close).toHaveBeenCalled();
      } else {
        throw new Error('Error handler not registered');
      }
    });
  });

  describe('handleJoinGame', () => {
    beforeEach(() => {
      mockRequest = {
        params: { matchId: 'match123', userId: 'guest456' },
      } as unknown as FastifyRequest;

      userRepository.getUserById.mockResolvedValue({ id: 'guest456', matchId: null });
      mockWebSocketService.validateMatchToJoin = vi.fn().mockResolvedValue(undefined);
      mockWebSocketService.joinGame = vi.fn().mockResolvedValue(undefined);
    });

    it('should join a game successfully', async () => {
      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      expect(validateString).toHaveBeenCalledWith('match123');
      expect(validateString).toHaveBeenCalledWith('guest456');
      expect(mockWebSocketService.validateMatchToJoin).toHaveBeenCalledWith('match123', 'guest456');
      expect(mockWebSocketService.joinGame).toHaveBeenCalledWith(
        validMatchDetails,
        'guest456',
        mockSocket
      );
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle error when guest tries to join their own match', async () => {
      mockRequest = {
        params: { matchId: 'match123', userId: 'user123' },
      } as unknown as FastifyRequest;
      userRepository.getUserById.mockResolvedValue({ id: 'user123', matchId: 'match123' });

      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should handle errors from validateMatchToJoin', async () => {
      mockWebSocketService.validateMatchToJoin = vi
        .fn()
        .mockRejectedValue(new Error('Match validation failed'));

      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should handle errors from joinGame', async () => {
      mockWebSocketService.joinGame = vi.fn().mockRejectedValue(new Error('Failed to join game'));

      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      expect(mockSocket.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'error', payload: { error: 'Internal server error' } })
      );
      expect(mockSocket.close).toHaveBeenCalled();
    });

    it('should send joining message on message event', async () => {
      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      const messageHandler = mockSocket.on.mock.calls.find(([event]) => event === 'message')?.[1];
      if (messageHandler) {
        messageHandler(Buffer.from('any message'));
        expect(mockSocket.send).toHaveBeenCalledWith(
          JSON.stringify({ message: 'Joining game...' })
        );
        expect(matchRepository.extendSession).toHaveBeenCalledWith('match123', 10);
      } else {
        throw new Error('Message handler not registered');
      }
    });

    it('should log error on socket error event', async () => {
      await controller.handleJoinGame(mockSocket as unknown as WebSocket, mockRequest);

      const errorHandler = mockSocket.on.mock.calls.find(([event]) => event === 'error')?.[1];
      if (errorHandler) {
        const error = new Error('Socket error');
        errorHandler(error);
        expect(vi.mocked(logger.error)).toHaveBeenCalledWith(error);
      } else {
        throw new Error('Error handler not registered');
      }
    });
  });
});