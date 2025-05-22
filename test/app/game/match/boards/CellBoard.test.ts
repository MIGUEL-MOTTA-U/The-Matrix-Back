import { describe, it, expect, vi } from 'vitest';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import Level1Board from '../../../../../src/app/game/match/boards/levels/Level1Board.js';
import Fruit from '../../../../../src/app/game/match/boards/Fruit.js';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach } from 'node:test';
import type Match from '../../../../../src/app/game/match/Match.js';

vi.mock('../../../../../src/server.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
  config: {
    ENEMIES_SPEED_MS: 1000,
  },
}));

describe('Cell', () => {
  const match = mockDeep<Match>();
  const board = new Level1Board(match, 'desert', 1);

  beforeEach(() => {
    mockReset(match);
  });

  it('should create empty cell', () => {
    const cell = new Cell(1, 1);
    expect(cell).toBeInstanceOf(Cell);
    expect(cell.blocked()).toBe(false);
    expect(cell.getUpCell()).toBeNull();
    expect(cell.getDownCell()).toBeNull();
    expect(cell.getLeftCell()).toBeNull();
    expect(cell.getRightCell()).toBeNull();
    expect(cell.getCharacter()).toBeNull();
    expect(cell.getItem()).toBeNull();
  });

  it('should pick a fruit', async () => {
    board.initialize();
    const cell = board.getBoard()[4][10];
    expect(cell.getItem()).toBeInstanceOf(Fruit);
    await cell.pickItem();
    expect(cell.getItem()).toBeNull();
  });

  it('should not pick if empty cell', () => {
    const cell = new Cell(1, 1);
    expect(cell.getItem()).toBeNull();
    cell.pickItem();
    expect(cell.getItem()).toBeNull();
  });

  it('should set character', () => {
    const cell = new Cell(1, 1);
    const troll = board.getBoard()[2][4].getCharacter();
    cell.setCharacter(troll);
    expect(troll).toBeInstanceOf(Troll);
    expect(cell.getCharacter()).toBeInstanceOf(Troll);
  });

  it('should return frozen status correctly', () => {
    const cell = new Cell(1, 1);
    expect(cell.isFrozen()).toBe(false);

    // We'll need to use executePower to make , trueit frozen
    // since 'frozen' is private
  });

  it('should freeze a cell in the up direction', () => {
    const cell = new Cell(2, 2);
    const cellToFreeze = new Cell(1, 2);

    cell.setNeighbors(cellToFreeze, null, null, null);

    const result = cell.executePower('up', true);

    expect(result.length).toBe(1);
    expect(result[0].coordinates).toEqual({ x: 1, y: 2 });
    expect(result[0].frozen).toBe(true);
    expect(cellToFreeze.isFrozen()).toBe(true);
  });

  it('should freeze a cell in the down direction', () => {
    const cell = new Cell(2, 2);
    const cellToFreeze = new Cell(3, 2);

    cell.setNeighbors(null, cellToFreeze, null, null);

    const result = cell.executePower('down', true);

    expect(result.length).toBe(1);
    expect(result[0].coordinates).toEqual({ x: 3, y: 2 });
    expect(result[0].frozen).toBe(true);
    expect(cellToFreeze.isFrozen()).toBe(true);
  });

  it('should freeze cells recursively in a direction', () => {
    const originalCell = new Cell(3, 3);
    const cell1 = new Cell(3, 4);
    const cell2 = new Cell(3, 5);
    const cell3 = new Cell(3, 6);

    originalCell.setNeighbors(null, null, null, cell1);
    cell1.setNeighbors(null, null, originalCell, cell2);
    cell2.setNeighbors(null, null, cell1, cell3);
    cell3.setNeighbors(null, null, cell2, null);

    const result = originalCell.executePower('right', true);

    expect(result.length).toBe(3);
    expect(cell1.isFrozen()).toBe(true);
    expect(cell2.isFrozen()).toBe(true);
    expect(cell3.isFrozen()).toBe(true);
  });

  it('should unfreeze cells when they are already frozen', () => {
    const originalCell = new Cell(3, 3);
    const cell1 = new Cell(3, 4);

    originalCell.setNeighbors(null, null, null, cell1);

    // First freeze the cell
    originalCell.executePower('right', true);
    expect(cell1.isFrozen()).toBe(true);

    // Then unfreeze it
    const result = originalCell.executePower('right', true);

    expect(result.length).toBe(1);
    expect(cell1.isFrozen()).toBe(false);
    expect(result[0].frozen).toBe(false);
  });

  it('should not freeze a blocked cell', () => {
    const originalCell = new Cell(3, 3);
    const blockedCell = new Cell(3, 4);

    // Mock the blocked method to return true
    vi.spyOn(blockedCell, 'blocked').mockReturnValue(true);

    originalCell.setNeighbors(null, null, null, blockedCell);

    const result = originalCell.executePower('right', true);

    expect(result.length).toBe(0);
    expect(blockedCell.isFrozen()).toBe(false);
  });

  it('should not freeze a cell with a character', () => {
    const originalCell = new Cell(3, 3);
    const cellWithCharacter = new Cell(3, 4);

    // Mock the getCharacter method to return a non-null value
    const mockCharacter = { kill: () => true };
    vi.spyOn(cellWithCharacter, 'getCharacter').mockReturnValue(mockCharacter as unknown as Troll);

    originalCell.setNeighbors(null, null, null, cellWithCharacter);

    const result = originalCell.executePower('right', true);

    expect(result.length).toBe(0);
  });

  it('should stop freezing at a blocking cell in a chain', () => {
    const originalCell = new Cell(3, 3);
    const cell1 = new Cell(3, 4);
    const cell2 = new Cell(3, 5);
    const blockedCell = new Cell(3, 6);

    originalCell.setNeighbors(null, null, null, cell1);
    cell1.setNeighbors(null, null, originalCell, cell2);
    cell2.setNeighbors(null, null, cell1, blockedCell);

    // Mock the blocked method to return true for the blocked cell
    vi.spyOn(blockedCell, 'blocked').mockReturnValue(true);

    const result = originalCell.executePower('right', true);

    expect(result.length).toBe(2);
    expect(cell1.isFrozen()).toBe(true);
    expect(cell2.isFrozen()).toBe(true);
    // The blocked cell should not be in the results
  });

  it('should throw error when using an invalid direction', () => {
    const cell = new Cell(1, 1);
    expect(() => cell.executePower('invalid', true)).toThrow('Not supported direction for freeze');
  });

  it('should return direction', () => {
    const cell = new Cell(1, 1);
      const result = cell.getDirection({ x: 1, y: 2 });
      expect(result).toBe('right');

    const result2 = cell.getDirection({ x: 0, y: 1 });
    expect(result2).toBe('up');

    const result3 = cell.getDirection({ x: 2, y: 1 });
    expect(result3).toBe('down');

    const result4 = cell.getDirection({ x: 1, y: 0 });
    expect(result4).toBe('left');

    const result5 = cell.getDirection({ x: 1, y: 1 });
    expect(result5).toBe(null);
  })

  it('should set neighbors', () => {
    const cell = new Cell(1, 1);
    const upCell = new Cell(0, 1);
    const downCell = new Cell(2, 1);
    const leftCell = new Cell(1, 0);
    const rightCell = new Cell(1, 2);

    cell.setNeighbors(upCell, downCell, leftCell, rightCell);

    expect(cell.getUpCell()).toEqual(upCell);
    expect(cell.getDownCell()).toEqual(downCell);
    expect(cell.getLeftCell()).toEqual(leftCell);
    expect(cell.getRightCell()).toEqual(rightCell);
  });

  it('should return neighbors', () => {
    const cell = new Cell(1, 1);
    const upCell = new Cell(0, 1);
    const downCell = new Cell(2, 1);
    const leftCell = new Cell(1, 0);
    const rightCell = new Cell(1, 2);

    cell.setNeighbors(upCell, downCell, leftCell, rightCell);
    const neighbors = cell.getNeighbors();
    expect(neighbors.length).toBe(4);
    expect(neighbors[0]).toEqual(upCell);
    expect(neighbors[1]).toEqual(downCell); 
    expect(neighbors[2]).toEqual(leftCell);
    expect(neighbors[3]).toEqual(rightCell);
  });
});