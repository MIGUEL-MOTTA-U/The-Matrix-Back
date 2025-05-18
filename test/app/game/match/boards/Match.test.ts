import { describe, it, expect, vi, beforeEach } from 'vitest';
import Match from '../../../../../src/app/game/match/Match.js';
import Level1Board from '../../../../../src/app/game/match/boards/levels/Level1Board.js';
import { mockDeep } from 'vitest-mock-extended';
import type GameService from '../../../../../src/app/game/services/GameService.js';
import type Player from '../../../../../src/app/game/characters/players/Player.js';
import type {
  BoardStorage,
  CellDTO,
  GameMessageOutput,
  MatchStorage,
  PlayerState,
  PlayerStorage,
} from '../../../../../src/schemas/zod.js';

vi.mock('../../../../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
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
    loadBoard: vi.fn(),
    getPlayersStorage: vi.fn().mockReturnValue({
      hostStorage: {
        id: 'host-id',
        coordinates: { x: 1, y: 1 },
        color: 'blue',
        direction: 'down',
        state: 'alive',
      },
      guestStorage: {
        id: 'guest-id',
        coordinates: { x: 2, y: 2 },
        color: 'red',
        direction: 'up',
        state: 'alive',
      },
    }),
    getBoardStorage: vi.fn().mockResolvedValue({
      fruitType: ['strawberry'],
      fruitsContainer: ['strawberry', 'banana'],
      fruitsNumber: 10,
      fruitsRound: 2,
      currentRound: 1,
      currentFruitType: 'strawberry',
      rocksCoordinates: [[1, 1]],
      fruitsCoordinates: [[2, 2]],
      board: [],
    }),
    checkWin: vi.fn().mockReturnValue(false),
    checkLose: vi.fn().mockReturnValue(false),
    cellsBoardDTO: vi.fn().mockReturnValue([]),
    getFruitTypes: vi.fn().mockReturnValue(['strawberry', 'banana']),
    getBoardDTO: vi.fn().mockReturnValue({}),
    getHost: vi.fn(),
    getGuest: vi.fn(),
  })),
}));

// Mock Worker
vi.mock('node:worker_threads', () => {
  const EventEmitter = require('node:events');

  class MockWorker extends EventEmitter {
    terminate = vi.fn().mockResolvedValue(undefined);

    constructor() {
      super();
      setTimeout(() => {
        this.emit('message', { type: 'tick' });
      }, 10);
    }
  }

  return { Worker: vi.fn().mockImplementation(() => new MockWorker()) };
});

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
      typeFruits: ['strawberry', 'banana'],
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
    await match.notifyPlayers(updateData as unknown as GameMessageOutput);
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

  describe('initialize', () => {
    it('should initialize the board', () => {
      match.initialize();

      // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
      expect((match as any).board.initialize).toHaveBeenCalled();
    });
  });

  describe('loadBoard', () => {
    it('should load the board with storage data', () => {
      const boardStorage: BoardStorage = {
        fruitType: ['strawberry'],
        fruitsContainer: ['strawberry', 'banana'],
        fruitsNumber: 10,
        fruitsRound: 2,
        currentRound: 1,
        currentFruitType: 'strawberry',
        rocksCoordinates: [[1, 1]],
        fruitsCoordinates: [[2, 2]],
        board: [],
      };

      const hostStorage: PlayerStorage = {
        id: 'host-id',
        coordinates: { x: 1, y: 1 },
        color: 'blue',
        direction: 'down',
        state: 'alive',
      };

      const guestStorage: PlayerStorage = {
        id: 'guest-id',
        coordinates: { x: 2, y: 2 },
        color: 'red',
        direction: 'up',
        state: 'alive',
      };

      match.loadBoard(boardStorage, hostStorage, guestStorage);

      // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
      expect((match as any).board.loadBoard).toHaveBeenCalledWith(
        boardStorage,
        hostStorage,
        guestStorage
      );
    });
  });

  describe('getMatchStorage', () => {
    it('should return the match storage data', async () => {
      const expectedStorage: MatchStorage = {
        id: 'match-id',
        level: 1,
        map: 'map-1',
        host: {
          id: 'host-id',
          coordinates: { x: 1, y: 1 },
          color: 'blue',
          direction: 'down',
          state: 'alive',
        },
        guest: {
          id: 'guest-id',
          coordinates: { x: 2, y: 2 },
          color: 'red',
          direction: 'up',
          state: 'alive',
        },
        board: {
          fruitType: ['strawberry'],
          fruitsContainer: ['strawberry', 'banana'],
          fruitsNumber: 10,
          fruitsRound: 2,
          currentRound: 1,
          currentFruitType: 'strawberry',
          rocksCoordinates: [[1, 1]],
          fruitsCoordinates: [[2, 2]],
          board: [],
        },
        timeSeconds: 300,
        fruitGenerated: false,
        paused: false,
      };

      const result = await match.getMatchStorage();
      expect(result).toEqual(expectedStorage);
    });
  });

  describe('pause and resume', () => {
    it('should pause the match', async () => {
      await match.pauseMatch();
      const paused = await match.isPaused();
      expect(paused).toBe(true);
    });

    it('should resume the match', async () => {
      await match.pauseMatch();
      let paused = await match.isPaused();
      expect(paused).toBe(true);

      await match.resumeMatch();
      paused = await match.isPaused();
      expect(paused).toBe(false);
    });

    it('should check if match is paused', async () => {
      let paused = await match.isPaused();
      expect(paused).toBe(false);

      await match.pauseMatch();
      paused = await match.isPaused();
      expect(paused).toBe(true);
    });
  });

  describe('time handling', () => {
    it('should stop time when seconds reach zero', async () => {
      Object.defineProperty(match, 'timeSeconds', { value: 0, writable: true });

      await match.startGame();

      await new Promise((resolve) => setTimeout(resolve, 50));

      // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
      expect((match as any).worker).toBeNull();
    });
  });

  describe('integration with board', () => {
    it('should correctly integrate board and match time for checkLose', () => {
      Object.defineProperty(match, 'timeSeconds', { value: 0 });
      expect(match.checkLose()).toBe(true);

      // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
      (match as any).board.checkLose.mockReturnValue(true);
      Object.defineProperty(match, 'timeSeconds', { value: 100 });
      expect(match.checkLose()).toBe(true);

      // biome-ignore lint/suspicious/noExplicitAny: For testing purposes
      (match as any).board.checkLose.mockReturnValue(false);
      expect(match.checkLose()).toBe(false);
    });
  });
});
