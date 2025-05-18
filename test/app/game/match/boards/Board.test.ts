import type Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import Level1Board from '../../../../../src/app/game/match/boards/levels/Level1Board.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type Match from '../../../../../src/app/game/match/Match.js';
import type Player from '../../../../../src/app/game/characters/players/Player.js';
import type {
  BoardStorage,
  PlayerStorage,
  CellDTO,
  PathResultWithDirection,
} from '../../../../../src/schemas/zod.js';
import type { Worker } from 'node:worker_threads';
vi.mock('../../../../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  config: {
    game: {
      board: { rows: 5, cols: 5 },
      fruits: { number: 3 },
    },
  },
}));

vi.mock('../../../../../src/utils/Graph.js', () => ({
  Graph: vi.fn().mockImplementation(() => ({
    addNode: vi.fn(),
    addEdge: vi.fn(),
  })),
}));

describe('Board', () => {
  const match = mockDeep<Match>();
  let board: Level1Board;
  const hostId = 'host-id';
  const guestId = 'guest-id';
  let hostMock: Player;
  let guestMock: Player;

  beforeEach(() => {
    mockReset(match);
    board = new Level1Board(match, 'desert', 1);

    vi.spyOn(board, 'initialize').mockImplementation(() => undefined);

    hostMock = mockDeep<Player>();
    guestMock = mockDeep<Player>();

    Object.defineProperty(board, 'host', { value: hostMock, writable: true });
    Object.defineProperty(board, 'guest', { value: guestMock, writable: true });

    hostMock.getId = vi.fn(() => hostId);
    guestMock.getId = vi.fn(() => guestId);
    hostMock.isAlive = vi.fn(() => true);
    guestMock.isAlive = vi.fn(() => true);
    hostMock.getPlayerStorage = vi.fn().mockReturnValue({
      id: hostId,
      coordinates: { x: 9, y: 1 },
      color: 'blue',
      direction: 'down',
      state: 'alive',
    });
    guestMock.getPlayerStorage = vi.fn().mockReturnValue({
      id: guestId,
      coordinates: { x: 9, y: 14 },
      color: 'red',
      direction: 'down',
      state: 'alive',
    });
  });

  describe('loadBoard', () => {
    it('should load board from storage data', () => {
      const boardStorage: BoardStorage = {
        fruitType: ['strawberry', 'banana'],
        fruitsContainer: ['strawberry', 'banana', 'apple'],
        fruitsNumber: 10,
        fruitsRound: 3,
        currentRound: 1,
        currentFruitType: 'strawberry',
        rocksCoordinates: [
          [1, 1],
          [2, 2],
        ],
        fruitsCoordinates: [
          [3, 3],
          [4, 4],
        ],
        board: [
          {
            coordinates: { x: 3, y: 3 },
            item: { type: 'fruit', id: 'fruit-1' },
            character: null,
            frozen: false,
          },
        ],
      };

      const hostStorage: PlayerStorage = {
        id: hostId,
        coordinates: { x: 5, y: 5 },
        color: 'blue',
        direction: 'down',
        state: 'alive',
      };

      const guestStorage: PlayerStorage = {
        id: guestId,
        coordinates: { x: 10, y: 10 },
        color: 'red',
        direction: 'up',
        state: 'alive',
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing purposes
      vi.spyOn(board as any, 'generateBoard').mockImplementation(() => {});
      // biome-ignore lint/suspicious/noExplicitAny: Testing purposes
      vi.spyOn(board as any, 'setUpPlayers').mockImplementation(() => {});
      // biome-ignore lint/suspicious/noExplicitAny: Testing purposes
      vi.spyOn(board as any, 'loadCells').mockImplementation(() => {});

      // Call the method
      board.loadBoard(boardStorage, hostStorage, guestStorage);

      // Assertions
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['FRUIT_TYPE']).toEqual(boardStorage.fruitType);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['FRUITS_CONTAINER']).toEqual(boardStorage.fruitsContainer);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['currentNumberFruits']).toBe(boardStorage.fruitsNumber);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['remainingFruitRounds']).toBe(boardStorage.fruitsRound);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['currentRound']).toBe(boardStorage.currentRound);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['currentFruitType']).toBe(boardStorage.currentFruitType);

      // Verify method calls
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['generateBoard']).toHaveBeenCalled();
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['setUpPlayers']).toHaveBeenCalledWith(
        hostId,
        guestId,
        hostStorage,
        guestStorage
      );
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['loadCells']).toHaveBeenCalledWith(boardStorage.board);
    });
  });

  describe('getPlayersStorage', () => {
    it('should return storage data for both players', () => {
      // Call method
      const result = board.getPlayersStorage();

      // Assertions
      expect(hostMock.getPlayerStorage).toHaveBeenCalled();
      expect(guestMock.getPlayerStorage).toHaveBeenCalled();
      expect(result).toEqual({
        hostStorage: hostMock.getPlayerStorage(),
        guestStorage: guestMock.getPlayerStorage(),
      });
    });

    it('should throw an error if players are not defined', () => {
      // Remove players
      Object.defineProperty(board, 'host', { value: null });
      Object.defineProperty(board, 'guest', { value: null });

      // Expect error
      expect(() => board.getPlayersStorage()).toThrow();
    });
  });

  describe('getBoardStorage', () => {
    it('should return the board storage data', async () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['FRUIT_TYPE'] = ['strawberry', 'banana'];
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['FRUITS_CONTAINER'] = ['strawberry', 'banana', 'apple'];
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 10;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['remainingFruitRounds'] = 3;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentRound'] = 1;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['rocksCoordinates'] = [
        [1, 1],
        [2, 2],
      ];
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['fruitsCoordinates'] = [
        [3, 3],
        [4, 4],
      ];

      vi.spyOn(board, 'cellsBoardDTO').mockReturnValue([
        {
          coordinates: { x: 1, y: 1 },
          item: null,
          character: null,
          frozen: false,
        },
      ]);

      // biome-ignore lint/suspicious/noExplicitAny: Testing purposes
      vi.spyOn(board as any, 'calcultateCurrentFruitType').mockReturnValue('strawberry');

      // Call method
      const result = await board.getBoardStorage();

      // Assertions
      expect(result).toEqual({
        fruitType: ['strawberry', 'banana'],
        fruitsContainer: ['strawberry', 'banana', 'apple'],
        fruitsNumber: 10,
        fruitsRound: 3,
        currentRound: 1,
        currentFruitType: 'strawberry',
        rocksCoordinates: [
          [1, 1],
          [2, 2],
        ],
        fruitsCoordinates: [
          [3, 3],
          [4, 4],
        ],
        board: board.cellsBoardDTO(),
      });
    });

    it('should throw an error if players are not defined', async () => {
      Object.defineProperty(board, 'host', { value: null });
      Object.defineProperty(board, 'guest', { value: null });

      await expect(board.getBoardStorage()).rejects.toThrow();
    });
  });

  describe('checkLose', () => {
    it('should return true when both players are dead', () => {
      hostMock.isAlive = vi.fn(() => false);
      guestMock.isAlive = vi.fn(() => false);

      expect(board.checkLose()).toBe(true);
    });

    it('should return false when at least one player is alive', () => {
      // One player alive
      hostMock.isAlive = vi.fn(() => true);
      guestMock.isAlive = vi.fn(() => false);
      expect(board.checkLose()).toBe(false);

      // Both alive
      hostMock.isAlive = vi.fn(() => true);
      guestMock.isAlive = vi.fn(() => true);
      expect(board.checkLose()).toBe(false);
    });

    it('should throw error if players are not defined', () => {
      Object.defineProperty(board, 'host', { value: null });
      Object.defineProperty(board, 'guest', { value: null });

      expect(() => board.checkLose()).toThrow();
    });
  });

  describe('getBoardDTO', () => {
    it('should return the board DTO with correct data', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['NUMENEMIES'] = 4;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['FRUITS'] = 10;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['playersStartCoordinates'] = [
        [9, 1],
        [9, 14],
      ];

      vi.spyOn(board, 'cellsBoardDTO').mockReturnValue([
        {
          coordinates: { x: 1, y: 1 },
          item: null,
          character: null,
          frozen: false,
        },
      ]);

      // Call method
      const result = board.getBoardDTO();

      // Assertions
      expect(result).toEqual({
        enemiesNumber: 4,
        fruitsNumber: 10,
        playersStartCoordinates: [
          [9, 1],
          [9, 14],
        ],
        cells: board.cellsBoardDTO(),
      });
    });
  });

  describe('checkWin', () => {
    it('should return true when conditions are met', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 0;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['remainingFruitRounds'] = 0;
      hostMock.isAlive = vi.fn(() => true);

      expect(board.checkWin()).toBe(true);
    });

    it('should return false when fruits remain', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 5;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['remainingFruitRounds'] = 0;

      expect(board.checkWin()).toBe(false);
    });

    it('should return false when rounds remain', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 0;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['remainingFruitRounds'] = 2;

      expect(board.checkWin()).toBe(false);
    });

    it('should return false when both players are dead', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 0;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['remainingFruitRounds'] = 0;
      //hostMock.isAlive.mockReturnValue(false);
      hostMock.isAlive = guestMock.isAlive = vi.fn(() => false);

      expect(board.checkWin()).toBe(false);
    });
  });

  describe('getUpdateFruits', () => {
    it('should return correct update fruits information', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentFruitType'] = 'strawberry';
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentNumberFruits'] = 5;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['currentRound'] = 2;
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['FRUIT_TYPE'] = ['banana', 'apple'];

      const cellsWithFruits = [
        {
          coordinates: { x: 3, y: 3 },
          item: { type: 'fruit', id: 'fruit-1' },
          character: null,
          frozen: false,
        },
      ];

      vi.spyOn(board, 'cellsBoardDTO').mockReturnValue([
        ...cellsWithFruits,
        {
          coordinates: { x: 1, y: 1 },
          item: null,
          character: null,
          frozen: false,
        },
      ]);

      // Call protected method using type assertion
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      const result = (board as unknown as Level1Board)['getUpdateFruits']();

      // Assertions
      expect(result).toEqual({
        fruitType: 'strawberry',
        fruitsNumber: 5,
        cells: expect.any(Array),
        currentRound: 2,
        nextFruitType: 'banana',
      });
    });
  });

  describe('getFruitTypes', () => {
    it('should return the fruit types array', () => {
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['FRUITS_CONTAINER'] = ['strawberry', 'banana', 'apple'];

      const result = board.getFruitTypes();

      expect(result).toEqual(['strawberry', 'banana', 'apple']);
    });
  });

  describe('cellsBoardDTO', () => {
    it('should return array of cell DTOs from the board', () => {
      // Create mock cells
      const mockCell1 = mockDeep<Cell>();
      const mockCell2 = mockDeep<Cell>();

      const cellDTO1: CellDTO = {
        coordinates: { x: 0, y: 0 },
        item: { type: 'fruit', id: 'fruit-1' },
        character: null,
        frozen: false,
      };

      const cellDTO2: CellDTO = {
        coordinates: { x: 0, y: 1 },
        item: null,
        character: { type: 'player', id: 'player-1', orientation: 'down' },
        frozen: true,
      };

      mockCell1.getCellDTO.mockReturnValue(cellDTO1);
      mockCell2.getCellDTO.mockReturnValue(cellDTO2);

      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['board'].splice(0, board['board'].length);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['board'].push([mockCell1, mockCell2]);

      // Call method
      const result = board.cellsBoardDTO();

      // Assertions
      expect(result).toEqual([cellDTO1, cellDTO2]);
    });

    it('should filter out null cells', () => {
      const mockCell = mockDeep<Cell>();
      mockCell.getCellDTO.mockReturnValue(null);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['board'].splice(0, board['board'].length);
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['board'].push([mockCell]);

      const result = board.cellsBoardDTO();

      expect(result).toEqual([]);
    });
  });

  describe('getBestDirectionToPlayers', () => {
    it('should return the best direction to players', () => {
      const mockCell = mockDeep<Cell>();
      const mockPath: PathResultWithDirection = {
        direction: 'up',
        distance: 2,
        path: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
      };

      vi.spyOn(board, 'getBestPathToPlayers').mockReturnValue(mockPath);

      const result = board.getBestDirectionToPlayers(mockCell, true);

      expect(result).toBe('up');
    });

    it('should return null when no path exists', () => {
      const mockCell = mockDeep<Cell>();

      vi.spyOn(board, 'getBestPathToPlayers').mockReturnValue(null);

      const result = board.getBestDirectionToPlayers(mockCell, true);

      expect(result).toBeNull();
    });

    it('should throw error if players are not defined', () => {
      const mockCell = mockDeep<Cell>();
      Object.defineProperty(board, 'host', { value: null });
      Object.defineProperty(board, 'guest', { value: null });

      expect(() => board.getBestDirectionToPlayers(mockCell, true)).toThrow();
    });
  });

  describe('getBestPathToPlayers', () => {
    it('should return the path with shortest distance', () => {
      const mockCell = mockDeep<Cell>();

      const hostPath: PathResultWithDirection = {
        direction: 'up',
        distance: 2,
        path: [
          { x: 0, y: 0 },
          { x: 0, y: 1 },
        ],
      };

      const guestPath: PathResultWithDirection = {
        direction: 'down',
        distance: 3,
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      };

      vi.spyOn(board, 'getPlayersPaths').mockReturnValue({
        hostPath,
        guestPath,
      });

      const result = board.getBestPathToPlayers(mockCell, true);

      expect(result).toBe(hostPath);
    });

    it('should return guest path when host path is null', () => {
      const mockCell = mockDeep<Cell>();

      const guestPath: PathResultWithDirection = {
        direction: 'down',
        distance: 3,
        path: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
      };

      vi.spyOn(board, 'getPlayersPaths').mockReturnValue({
        hostPath: null,
        guestPath,
      });

      const result = board.getBestPathToPlayers(mockCell, true);

      expect(result).toBe(guestPath);
    });

    it('should return null when both paths are null', () => {
      const mockCell = mockDeep<Cell>();

      vi.spyOn(board, 'getPlayersPaths').mockReturnValue({
        hostPath: null,
        guestPath: null,
      });

      const result = board.getBestPathToPlayers(mockCell, true);

      expect(result).toBeNull();
    });
  });

  describe('stopGame', () => {
    it('should terminate all worker threads', async () => {
      const mockWorker1 = mockDeep<Worker>();
      mockWorker1.terminate.mockResolvedValue(0);
      const mockWorker2 = mockDeep<Worker>();
      mockWorker2.terminate.mockResolvedValue(0);

      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      board['workers'] = [mockWorker1, mockWorker2];

      await board.stopGame();

      expect(mockWorker1.terminate).toHaveBeenCalled();
      expect(mockWorker2.terminate).toHaveBeenCalled();
      // biome-ignore lint/complexity/useLiteralKeys: Testing purposes
      expect(board['workers']).toEqual([]);
    });
  });


describe('generateSpecialFruit', () => {
  it('should generate a special fruit on an available cell', async () => {
    const mockCell1 = mockDeep<Cell>();
    const mockCell2 = mockDeep<Cell>();
    
    mockCell1.blocked.mockReturnValue(true);
    mockCell2.blocked.mockReturnValue(false);
    mockCell2.getCharacter.mockReturnValue(null);
    mockCell2.getItem.mockReturnValue(null);
    
    const cellDTO = {
      coordinates: { x: 0, y: 1 },
      item: { type: 'specialfruit', id: 'special-1' },
      character: null,
      frozen: false
    };
    mockCell2.getCellDTO.mockReturnValue(cellDTO);

    const boardCells = board.getBoard()
    boardCells.push([mockCell1, mockCell2]);
    
    vi.mock('../../../../../src/app/game/match/boards/SpecialFruit.js', () => ({
      default: vi.fn().mockImplementation(() => ({
        type: 'specialfruit',
        id: 'special-1'
      }))
    }));
    
    const result = await board.generateSpecialFruit();
    
    expect(mockCell2.setItem).toHaveBeenCalled();
    expect(result).toEqual(cellDTO);
  });
  
  it('should return null when no cell is available', async () => {
    const mockCell = mockDeep<Cell>();
    mockCell.blocked.mockReturnValue(true);
    
    
    const result = await board.generateSpecialFruit();
    
    expect(result).toBeNull();
  });
});

describe('revivePlayers', () => {
  it('should revive a dead player and return their state', () => {
    hostMock.isAlive = vi.fn().mockReturnValue(true);
    guestMock.isAlive = vi.fn().mockReturnValue(false);
    
    const playerState = { state: 'alive' };
    guestMock.reborn = vi.fn();
    guestMock.getCharacterState = vi.fn().mockReturnValue(playerState);
    
    const result = board.revivePlayers();
    
    expect(guestMock.reborn).toHaveBeenCalled();
    expect(result).toEqual(playerState);
  });
  
  it('should revive the host if both players are dead (host has priority)', () => {
    hostMock.isAlive = vi.fn().mockReturnValue(false);
    guestMock.isAlive = vi.fn().mockReturnValue(false);
    
    const playerState = { state: 'alive' };
    hostMock.reborn = vi.fn();
    hostMock.getCharacterState = vi.fn().mockReturnValue(playerState);
    
    const result = board.revivePlayers();
    
    expect(hostMock.reborn).toHaveBeenCalled();
    expect(guestMock.reborn).not.toHaveBeenCalled();
    expect(result).toEqual(playerState);
  });
  
  it('should return null if all players are alive', () => {
    hostMock.isAlive = vi.fn().mockReturnValue(true);
    guestMock.isAlive = vi.fn().mockReturnValue(true);
    
    const result = board.revivePlayers();
    
    expect(hostMock.reborn).not.toHaveBeenCalled();
    expect(guestMock.reborn).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
  
  it('should throw error if players are not defined', () => {
    Object.defineProperty(board, 'host', { value: null });
    Object.defineProperty(board, 'guest', { value: null });
    
    expect(() => board.revivePlayers()).toThrow();
  });
});
});