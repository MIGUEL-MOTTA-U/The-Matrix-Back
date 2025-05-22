import { WebSocket } from 'ws';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { logger } from '../../../src/server.js';
import WebSocketServiceImpl from '../../../src/app/lobbies/services/WebSocketServiceImpl.js';
import type MatchRepository from '../../../src/schemas/MatchRepository.js';
import type MatchMakingService from '../../../src/app/lobbies/services/MatchMakingService.js';
import type Match from '../../../src/app/game/match/Match.js';
import type { MatchDetails, MatchDTO } from '../../../src/schemas/zod.js';
import SocketConnections from '../../../src/app/shared/SocketConnectionsServiceImpl.js';

vi.mock('../../../src/server.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const matchRepository = mockDeep<MatchRepository>();
const matchMakingService = mockDeep<MatchMakingService>();
const connections = new SocketConnections();
const webSocketServiceImpl = new WebSocketServiceImpl(matchRepository, connections);
webSocketServiceImpl.setMatchMakingService(matchMakingService);
describe('WebSocketServiceImpl', () => {
  beforeEach(() => {
    mockReset(matchRepository);
    mockReset(matchMakingService);
    connections.clearConnections();
  });

  it('should register a connection', () => {
    const userId = 'user1';
    const socket = mockDeep<WebSocket>() as unknown as WebSocket;
    webSocketServiceImpl.registerConnection(userId, socket);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['connections'].getConnection(userId)).toBe(socket);
  });

  it('should remove a connection', () => {
    const userId = 'user1';
    const socket = mockDeep<WebSocket>() as unknown as WebSocket;
    webSocketServiceImpl.registerConnection(userId, socket);
    webSocketServiceImpl.removeConnection(userId);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['connections'].isConnected(userId)).toBe(false);
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
        cells: [],
      },
      typeFruits: [],
    } as unknown as MatchDTO;
    match.getMatchDTO.mockReturnValue(matchMocked);

    webSocketServiceImpl.registerConnection('host1', hostSocket);
    webSocketServiceImpl.registerConnection('guest1', guestSocket);

    await webSocketServiceImpl.notifyMatchFound(match);

    expect(hostSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ message: 'match-found', match: matchMocked })
    );
    expect(guestSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ message: 'match-found', match: matchMocked })
    );
    expect(hostSocket.close).toHaveBeenCalled();
    expect(guestSocket.close).toHaveBeenCalled();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['connections'].isConnected('host1')).toBe(false);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['connections'].isConnected('guest1')).toBe(false);
    expect(matchRepository.updateMatch).toHaveBeenCalledWith(match.getId(), { started: true });
  });

  it('should log a warning if one of the players is not connected', async () => {
    const match = mockDeep<Match>();
    match.getHost.mockReturnValue('host1');
    match.getGuest.mockReturnValue('guest1');

    await webSocketServiceImpl.notifyMatchFound(match);

    expect(vi.mocked(logger.warn)).toHaveBeenCalledWith(
      'An error occurred on Web Socket Service While trying to notify match...'
    );
  });

  it('should validate match to join', async () => {
    const matchId = 'match1';
    const guestId = 'guest1';
    const matchDetails = {
      id: matchId,
      host: 'host1',
      guest: null,
      started: false,
    } as MatchDetails;
    matchRepository.getMatchById.mockResolvedValue(matchDetails);
    const hostSocket = mockDeep<WebSocket>();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    webSocketServiceImpl['matchesHosted'].set(matchId, hostSocket);
    Object.defineProperty(hostSocket, 'readyState', {
      configurable: true,
      get: () => WebSocket.OPEN,
    });

    await webSocketServiceImpl.validateMatchToJoin(matchId, guestId);

    expect(matchRepository.getMatchById).toHaveBeenCalledWith(matchId);
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    expect(webSocketServiceImpl['matchesHosted'].get(matchId)).toBeDefined();
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    expect(webSocketServiceImpl['matchesHosted'].get(matchId)?.readyState).toBe(WebSocket.OPEN);
  });

  it('should throw an error if the match is already started', async () => {
    const matchId = 'match1';
    const guestId = 'guest1';
    const matchDetails = { id: matchId, host: 'host1', guest: null, started: true } as MatchDetails;
    matchRepository.getMatchById.mockResolvedValue(matchDetails);

    await expect(webSocketServiceImpl.validateMatchToJoin(matchId, guestId)).rejects.toThrowError(
      'The match has already started'
    );
  });

  // it('should throw an error if the match has started', async () => {
  //   const matchId = 'match1';
  //   const guestId = 'guest1f';
  //   const matchDetails = {
  //     id: matchId,
  //     host: 'host1',
  //     guest: guestId,
  //     started: true,
  //   } as MatchDetails;
  //   matchRepository.getMatchById.mockResolvedValue(matchDetails);

  //   await expect(webSocketServiceImpl.validateMatchToJoin(matchId, guestId)).rejects.toThrowError(
  //     'The match has already started'
  //   );
  // });

  it('should validate match to publish', async () => {
    const matchId = 'match1';
    const hostId = 'host1';
    const matchDetails = { id: matchId, host: hostId, guest: null, started: false } as MatchDetails;
    matchRepository.getMatchById.mockResolvedValue(matchDetails);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    webSocketServiceImpl['matchesHosted'].clear();

    await webSocketServiceImpl.validateMatchToPublish(matchId, hostId);

    expect(matchRepository.getMatchById).toHaveBeenCalledWith(matchId);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['matchesHosted'].has(matchId)).toBe(false);
  });

  it('should throw an error if the match is already hosted', async () => {
    const matchId = 'match1';
    const hostId = 'host1';
    const matchDetails = { id: matchId, host: hostId, guest: null, started: false } as MatchDetails;
    matchRepository.getMatchById.mockResolvedValue(matchDetails);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    webSocketServiceImpl['matchesHosted'].set(matchId, mockDeep<WebSocket>());

    await expect(webSocketServiceImpl.validateMatchToPublish(matchId, hostId)).rejects.toThrowError(
      'The match has already been published'
    );
  });

  it('should throw an error if the host is not connected', async () => {
    const matchId = 'match1';
    const hostId = 'host1';
    const matchDetails = {
      id: matchId,
      host: 'different host',
      guest: null,
      started: false,
    } as MatchDetails;
    matchRepository.getMatchById.mockResolvedValue(matchDetails);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    webSocketServiceImpl['matchesHosted'].clear();

    await expect(webSocketServiceImpl.validateMatchToPublish(matchId, hostId)).rejects.toThrowError(
      'The player is not connected'
    );
  });

  it('should join a game', async () => {
    const matchDetails = { id: 'match1', host: 'host1', guest: null } as MatchDetails;
    const guestId = 'guest1';
    const guestSocket = mockDeep<WebSocket>() as unknown as WebSocket;
    const hostSocket = mockDeep<WebSocket>() as unknown as WebSocket;

    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    webSocketServiceImpl['matchesHosted'].set(matchDetails.id, hostSocket);

    Object.defineProperty(hostSocket, 'readyState', {
      configurable: true,
      get: () => WebSocket.OPEN,
    });

    Object.defineProperty(guestSocket, 'readyState', {
      configurable: true,
      get: () => WebSocket.OPEN,
    });
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
        cells: [],
      },
      typeFruits: [],
    } as unknown as MatchDTO;
    matchMakingService.joinMatch.mockResolvedValue(matchMocked);

    await webSocketServiceImpl.joinGame(matchDetails, guestId, guestSocket);

    expect(matchMakingService.joinMatch).toHaveBeenCalledWith(matchDetails, guestId);
    expect(guestSocket.send).toHaveBeenCalledWith(
      JSON.stringify({ message: 'match-found', match: matchMocked })
    );
  });

  it('should publish a match', () => {
    const matchId = 'match1';
    const socket = mockDeep<WebSocket>() as unknown as WebSocket;
    webSocketServiceImpl.publishMatch(matchId, socket);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['matchesHosted'].get(matchId)).toBe(socket);
  });

  it('should remove a published match', () => {
    const matchId = 'match1';
    const socket = mockDeep<WebSocket>() as unknown as WebSocket;
    webSocketServiceImpl.publishMatch(matchId, socket);
    webSocketServiceImpl.removePublishedMatch(matchId);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(webSocketServiceImpl['matchesHosted'].has(matchId)).toBe(false);
  });
});