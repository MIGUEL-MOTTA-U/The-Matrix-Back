import { describe, it, expect, vi, beforeEach } from 'vitest';
import Match from '../../../../../src/app/game/match/Match.js';
import Level1Board from '../../../../../src/app/game/match/boards/levels/Level1Board.js';
import { mockDeep } from 'vitest-mock-extended';
import type GameService from '../../../../../src/app/game/services/GameService.js';
import type Player from '../../../../../src/app/game/characters/players/Player.js';
import type {
  CellDTO,
  GameMessageOutput,
  PlayerState,
} from '../../../../../src/schemas/zod.js';

vi.mock('../../../../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  config: {
    MATCH_TIME_SECONDS: 300,
    NODE_ENV: 'development',
  },
}));

vi.mock('../../../../../src/app/game/match/boards/levels/Level1Board.js', () => ({
  default: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    startGame: vi.fn(),
    stopGame: vi.fn(),
    checkWin: vi.fn().mockReturnValue(false),
    checkLose: vi.fn().mockReturnValue(false),
    cellsBoardDTO: vi.fn().mockReturnValue([]),
    getFruitTypes: vi.fn().mockReturnValue([]),
    getBoardDTO: vi.fn().mockReturnValue({}),
    getHost: vi.fn(),
    getGuest: vi.fn(),
  })),
}));

describe('Match', () => {
  let gameServiceMock: GameService;
  let match: Match;

  beforeEach(() => {
    gameServiceMock = mockDeep<GameService>();
    match = new Match(gameServiceMock, 'match-id', 1, 'map-1', 'host-id', 'guest-id');
  });

  it('should initialize the match', () => {  
    expect(Level1Board).toHaveBeenCalledWith(match, 'map-1', 1);
    expect(match.isRunning()).toBe(true);
  });

  it('should return the match ID', () => {
    expect(match.getId()).toBe('match-id');
  });

  it('should return the host and guest IDs', () => {
    expect(match.getHost()).toBe('host-id');
    expect(match.getGuest()).toBe('guest-id');
  });

  it('should start the game', async () => {
    await match.startGame();
    expect(match.isRunning()).toBe(true);
  });

  it('should stop the game', async () => {
    await match.stopGame();
    expect(match.isRunning()).toBe(false);
  });

  it('should check win and lose conditions', () => {
    expect(match.checkWin()).toBe(false);
    expect(match.checkLose()).toBe(false);
  });

  it('should retrieve match DTO', () => {
    const dto = match.getMatchDTO();
    expect(dto).toEqual({
      id: 'match-id',
      level: 1,
      map: 'map-1',
      hostId: 'host-id',
      guestId: 'guest-id',
      typeFruits: [],
      board: {},
    });
  });

  it('should retrieve player by ID', () => {
    const hostMock = mockDeep<Player>();
    const guestMock = mockDeep<Player>();
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    (match as any).board.getHost.mockReturnValue(hostMock);
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    (match as any).board.getGuest.mockReturnValue(guestMock);

    expect(match.getPlayer('host-id')).toBe(hostMock);
    expect(match.getPlayer('guest-id')).toBe(guestMock);
  });

  it('should notify players with updates', async () => {
    const updateData = { type: 'update' };
    await match.notifyPlayers(
      updateData as unknown as GameMessageOutput
    );
    expect(gameServiceMock.updatePlayers).toHaveBeenCalledWith(
      'match-id',
      'host-id',
      'guest-id',
      updateData
    );
  });

  it('should retrieve the match update', () => {
    const mockTime = { minutesLeft: 5, secondsLeft: 0 };
    const mockPlayers: PlayerState[] = [
      { id: 'host-id', state: 'alive' },
      { id: 'guest-id', state: 'alive' },
    ];
    const mockBoard: CellDTO[] = [
      {
        coordinates: { x: 0, y: 0 },
        item: null,
        character: null,
        frozen: false,
      },
    ];

    vi.spyOn(match, 'getUpdateTime').mockReturnValue(mockTime);
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    (match as any).board.cellsBoardDTO.mockReturnValue(mockBoard);
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    vi.spyOn(match as any, 'getPlayers').mockReturnValue(mockPlayers);

    const update = match.getMatchUpdate();

    expect(update).toEqual({
      time: mockTime,
      players: mockPlayers,
      cells: mockBoard,
    });

    // Verify that the mocked methods were called
    expect(match.getUpdateTime).toHaveBeenCalled();
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    expect((match as any).board.cellsBoardDTO).toHaveBeenCalled();
    // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
    expect((match as any).getPlayers).toHaveBeenCalled();
  });

  it('should return the time left in the match', () => {
    const time = match.getUpdateTime();
    expect(time).toEqual({
      minutesLeft: 5,
      secondsLeft: 0,
    });
  });
});
