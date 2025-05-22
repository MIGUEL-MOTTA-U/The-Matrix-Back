import { describe, it, expect, vi, beforeEach } from 'vitest';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import CharacterError from '../../../../../src/errors/CharacterError.js';
import type Character from '../../../../../src/app/game/characters/Character.js';
import { mockDeep } from 'vitest-mock-extended';
import type Board from '../../../../../src/app/game/match/boards/Board.js';
import type { BoardItemDTO, Direction } from '../../../../../src/schemas/zod.js';
const mockCell = mockDeep<Cell>();
const mockBoard = mockDeep<Board>();

vi.mock('../../../../../src/server.js', () => {
    return {
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        config: {
            ENEMIES_SPEED_MS: 1000,
        },
    };
}
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Troll', () => {
  it('should get DTO', () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    const dto: BoardItemDTO = troll.getDTO();
    expect(dto).toEqual({ type: 'troll', orientation: 'down', id: 'troll-id' });
  });

  it('should move to a new cell and interact with character', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    const mockCharacter = mockDeep<Character>();
    mockCell.setCharacter(mockCharacter);
    const newCell = mockDeep<Cell>();
    newCell.setCharacter(null);

    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    const result = await troll['move'](newCell, mockCharacter);
    expect(result).toBe(null);
    expect(mockCell.setCharacter).toHaveBeenCalledWith(null);
    expect(newCell.setCharacter).toHaveBeenCalledWith(troll);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['cell']).toBe(newCell);
  });

  it('should throw error if cell is null', () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(() => troll['validateMove'](null)).toThrow(CharacterError);
  });

  it('should calculate movement and keep moving', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['keepMoving'] = vi.fn().mockResolvedValue(undefined);
    await troll.calculateMovement();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['keepMoving']).toHaveBeenCalled();
  });

  it('should move in random direction if keep moving fails', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['keepMoving'] = vi.fn().mockRejectedValue(new Error('Keep moving failed'));
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['moveRandomDirection'] = vi.fn().mockResolvedValue(undefined);
    await troll.calculateMovement();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveRandomDirection']).toHaveBeenCalled();
  });

  it('should move in random direction until successful', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['keepMoving'] = vi.fn().mockRejectedValue(new Error('Keep moving failed'));
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['moveRandomDirection'] = vi
      .fn()
      .mockRejectedValueOnce(new Error('Move failed'))
      .mockResolvedValue(undefined);
    await troll.calculateMovement();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveRandomDirection']).toHaveBeenCalledTimes(2);
  });

  it('should move up', async () => {
    const mockCellUp = new Cell(0, 1);
    const mockCell = new Cell(0, 0);
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['cell'].getUpCell = vi.fn().mockReturnValue(mockCellUp);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['validateMove'] = vi.fn().mockReturnValue({ character: null, cell: mockCellUp });
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['move'] = vi.fn().mockResolvedValue(null);
    await troll.moveUp();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['move']).toHaveBeenCalledWith(mockCellUp, null);
  });

  it('should keep moving', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    troll['moveDown'] = vi.fn().mockResolvedValue(null);
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    troll['moveLeft'] = vi.fn().mockResolvedValue(null);
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    troll['moveRight'] = vi.fn().mockResolvedValue(null);
    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    troll['moveUp'] = vi.fn().mockResolvedValue(null);

    // biome-ignore lint/complexity/useLiteralKeys: <explanation>
    await troll['keepMoving']();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveDown']).toHaveBeenCalledWith();

    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['orientation'] = 'left';
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    await troll['keepMoving']();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveLeft']).toHaveBeenCalledWith();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['orientation'] = 'right';
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    await troll['keepMoving']();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveRight']).toHaveBeenCalledWith();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['orientation'] = 'up';
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    await troll['keepMoving']();
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveUp']).toHaveBeenCalledWith();
  })

  it('should move random direction', async () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    const directions:Direction[] = ['down'];
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    troll['moveDown'] = vi.fn().mockResolvedValue(null);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    await troll['moveRandomDirection'](directions);
    // biome-ignore lint/complexity/useLiteralKeys: For testing purposes
    expect(troll['moveDown']).toHaveBeenCalledWith();
  });

  it('should return enemy name', () => {
    const troll = new Troll(mockCell, mockBoard, 'troll-id');
    const name = troll.getEnemyName();
    expect(name).toBe('troll');
  })
});