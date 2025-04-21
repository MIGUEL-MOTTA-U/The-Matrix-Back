import type { WebSocket } from 'ws';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset, } from 'vitest-mock-extended';
import { logger } from '../../../src/server.js';
import WebSocketServiceImpl from '../../../src/app/lobbies/services/WebSocketServiceImpl.js';
import type MatchRepository from '../../../src/schemas/MatchRepository.js';
import type MatchMakingService from '../../../src/app/lobbies/services/MatchMakingService.js';
import type Match from '../../../src/app/game/match/Match.js';
import type { MatchDetails, MatchDTO } from '../../../src/schemas/zod.js';

vi.mock('../../../src/server.js', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

const matchRepository = mockDeep<MatchRepository>();
const matchMakingService = mockDeep<MatchMakingService>();
const webSocketServiceImpl = WebSocketServiceImpl.getInstance(matchMakingService, matchRepository);
describe('WebSocketServiceImpl', () => {
    beforeEach(() => {
        mockReset(matchRepository);
        mockReset(matchMakingService);
        // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
        webSocketServiceImpl['connections'].clear();
    });

    it('should register a connection', () => {
        const userId = 'user1';
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        webSocketServiceImpl.registerConnection(userId, socket);
        // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
        expect(webSocketServiceImpl['connections'].get(userId)).toBe(socket);
    });

    it('should remove a connection', () => {
        const userId = 'user1';
        const socket = mockDeep<WebSocket>() as unknown as WebSocket;
        webSocketServiceImpl.registerConnection(userId, socket);
        webSocketServiceImpl.removeConnection(userId);
        // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
        expect(webSocketServiceImpl['connections'].has(userId)).toBe(false);
    });

    it('should call matchMakingService.searchMatch with match details', async () => {
        const matchDetails = { id: 'match1' } as MatchDetails;
        await webSocketServiceImpl.matchMaking(matchDetails);
        expect(matchMakingService.searchMatch).toHaveBeenCalledWith(matchDetails);
    });

    it('should notify players when a match is found', async () => {
        const match = mockDeep<Match>();
        const hostSocket = mockDeep<WebSocket>() as unknown as WebSocket;
        const guestSocket = mockDeep<WebSocket>() as unknown as WebSocket;

        match.getHost.mockReturnValue('host1');
        match.getGuest.mockReturnValue('guest1');
        const matchMocked = {
            id: 'match1',
            level: 0,
            map: '',
            hostId: '',
            guestId: '',
            board: {
                enemiesNumber: 0,
                fruitsNumber: 0,
                playersStartCoordinates: [],
                cells: []
            },
            typeFruits: []
        } as unknown as MatchDTO;
        match.getMatchDTO.mockReturnValue(matchMocked);

        webSocketServiceImpl.registerConnection('host1', hostSocket);
        webSocketServiceImpl.registerConnection('guest1', guestSocket);

        await webSocketServiceImpl.notifyMatchFound(match, 'ghostMatch1');

        expect(hostSocket.send).toHaveBeenCalledWith(JSON.stringify({ message: 'match-found', match: matchMocked }));
        expect(guestSocket.send).toHaveBeenCalledWith(JSON.stringify({ message: 'match-found', match: matchMocked }));
        expect(hostSocket.close).toHaveBeenCalled();
        expect(guestSocket.close).toHaveBeenCalled();
        // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
        expect(webSocketServiceImpl['connections'].has('host1')).toBe(false);
        // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
        expect(webSocketServiceImpl['connections'].has('guest1')).toBe(false);
        expect(matchRepository.updateMatch).toHaveBeenCalledWith(match.getId(), { started: true });
        expect(matchRepository.removeMatch).toHaveBeenCalledWith('ghostMatch1');
    });

    it('should log a warning if one of the players is not connected', async () => {
        const match = mockDeep<Match>();
        match.getHost.mockReturnValue('host1');
        match.getGuest.mockReturnValue('guest1');

        await webSocketServiceImpl.notifyMatchFound(match, 'ghostMatch1');

        expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
            'An error occurred on Web Socket Service While trying to notify match...'
        );
    });
});