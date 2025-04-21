import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { WebSocket } from 'ws';
import GameController from '../../src/controllers/websockets/GameController.js';
import { mockDeep } from 'vitest-mock-extended';
import type UserRepository from '../../src/schemas/UserRepository.js';
import type MatchRepository from '../../src/schemas/MatchRepository.js';
import { logger } from '../../src/server.js';
import GameError from 'src/errors/GameError.js';
import type { FastifyRequest } from 'fastify';
vi.mock('../../src/server.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../src/app/game/services/GameServiceImpl.js', () => ({
    default: {
        getInstance: vi.fn(() => ({
            registerConnection: vi.fn(),
            startMatch: vi.fn(),
            getMatchUpdate: vi.fn(),
            handleGameMessage: vi.fn(),
            removeConnection: vi.fn(),
            extendUsersSession: vi.fn(),
            extendMatchSession: vi.fn(),
            checkMatchDetails: vi.fn(),
        })),
    },
}));

const userRepository = mockDeep<UserRepository>();
const matchRepository = mockDeep<MatchRepository>();
const gameController = GameController.getInstance(matchRepository, userRepository);

describe('GameController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should handle a WebSocket connection and start a match', async () => {
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        const request = {
            params: { userId: 'user1', matchId: 'match1' },
        } as unknown as FastifyRequest;

        userRepository.userExists.mockResolvedValue(true);
        matchRepository.matchExists.mockResolvedValue(true);
        matchRepository.getMatchById.mockResolvedValue({
            id: 'match1',
            host: 'user1',
            guest: 'user2',
            level: 0,
            map: '',
        });

        await gameController.handleGameConnection(socket, request);
        expect(socket.send).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(
            'The User: user1 is connected to the match match1'
        );
    });

    it('should handle a WebSocket connection and reconnect a match', async () => {
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        const request = {
            params: { userId: 'user1', matchId: 'match1' },
        } as unknown as FastifyRequest;

        userRepository.userExists.mockResolvedValue(true);
        matchRepository.matchExists.mockResolvedValue(true);
        matchRepository.getMatchById.mockResolvedValue({
            id: 'match1',
            host: 'user1',
            guest: 'user2',
            level: 0,
            map: '',
        });
        

        await gameController.handleGameConnection(socket, request);
        expect(socket.send).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalled();
    });

    it('should handle validation errors and close the socket', async () => {
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        const request = {
            params: { userId: 'user1', matchId: 'match1' },
        } as unknown as FastifyRequest;

        userRepository.userExists.mockResolvedValue(false);

        await gameController.handleGameConnection(socket, request);

        expect(logger.warn).toHaveBeenCalledWith(
            'An error occurred on Socket message request...'
        );
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                code: 404,
                message: GameError.USER_NOT_FOUND,
            })
        );
        expect(socket.close).toHaveBeenCalled();
    });

    it('should validate user and match data', async () => {
        userRepository.userExists.mockResolvedValue(true);
        matchRepository.matchExists.mockResolvedValue(true);
        matchRepository.getMatchById.mockResolvedValue({
            id: 'match1',
            host: 'user1',
            guest: 'user2',
            level: 0,
            map: ''
        });

        // biome-ignore lint/complexity/useLiteralKeys: For test purposes
        const result = await gameController['validateData']({
            userId: 'user1',
            matchId: 'match1',
        });

        expect(result).toEqual({
            matchId: 'match1',
            userId: 'user1',
            matchDetails: {
                id: 'match1',
                host: 'user1',
                guest: 'user2',
                level: 0,
                map: '',
            },
        });
    });

    it('should log and send an error when handleError is called', () => {
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        const error = new GameError(GameError.USER_NOT_FOUND);

        // biome-ignore lint/complexity/useLiteralKeys: For test purposes
        gameController['handleError'](error, socket);

        expect(logger.warn).toHaveBeenCalledWith(
            'An error occurred on Socket message request...'
        );
        expect(logger.error).toHaveBeenCalledWith(error);
        
    });
});