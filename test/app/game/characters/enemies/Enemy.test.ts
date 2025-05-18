import { describe, it, expect, vi, beforeEach } from 'vitest';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import { mockDeep } from 'vitest-mock-extended';
import type Board from '../../../../../src/app/game/match/boards/Board.js';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';
import CharacterError from 'src/errors/CharacterError.js';
import type { UpdateEnemy } from 'src/schemas/zod.js';
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
});

describe('LogMan tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should validate movement successfully', () => {
        const troll = new Troll(mockCell, mockBoard);
        const cell = new Cell(2,2);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const { character } = troll["validateMove"](cell);
        expect(character).toBe(null);
    });

    it('should validate movement if cell is blocked', () => {
        const troll = new Troll(mockCell, mockBoard);
        const cell = new Cell(2,2);
        cell.blocked = vi.fn().mockReturnValue(true);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(() => troll['validateMove'](cell)).toThrowError(new CharacterError(CharacterError.BLOCKED_CELL).message)
    })
    it('should validate movement if cell is blocked', () => {
        const troll = new Troll(mockCell, mockBoard);
        const cell = new Cell(2,2);
        const troll2 = new Troll(cell, mockBoard);
        cell.setCharacter(troll2);
        //cell.blocked = vi.fn().mockReturnValue(true);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(() => troll['validateMove'](cell)).toThrowError(new CharacterError(CharacterError.BLOCKED_CELL).message)
    })

    it('should validate movement if cell is frozen', () => {
        const troll = new Troll(mockCell, mockBoard);
        const cell = new Cell(2,2);
        cell.isFrozen = vi.fn().mockReturnValue(true);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(() => troll['validateMove'](cell)).toThrowError(new CharacterError(CharacterError.BLOCKED_CELL).message)
    })

    it('should kill', () => {
        const troll = new Troll(mockCell, mockBoard);
        expect(troll.kill()).toBe(true);
    })

    it('should not die', () => {
        const troll = new Troll(mockCell, mockBoard);
        expect(troll.die()).toBe(false);
    })

    it('should do nothing on reborn', () => {
        const troll = new Troll(mockCell, mockBoard);
        expect(troll.reborn()).toBe(undefined);
    })

    it('should not execute power', async () => {
        const troll = new Troll(mockCell, mockBoard);
        await expect(troll.execPower('down')).resolves.toEqual([]);
    });

    it('should notify players', async () => {
        const troll = new Troll(mockCell, mockBoard);
        const event = 'update-enemy';
        const payload: UpdateEnemy = {
            enemyId: 'troll-id',
            coordinates: { x: 1, y: 1 },
            direction: 'down',
            enemyState: 'walking',
        };
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await troll["notifyPlayers"](event, payload);
        expect(mockBoard.notifyPlayers).toHaveBeenCalledTimes(1);
    });

    it('should move along path Down', async () => {
        const troll = new Troll(mockCell, mockBoard);
        const path = 'down';
        troll.moveDown = vi.fn();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await troll["moveAlongPath"](path);
        expect(troll.moveDown).toHaveBeenCalledTimes(1);
    })
    it('should move along path up', async () => {
        const troll = new Troll(mockCell, mockBoard);
        const path = 'up';
        troll.moveUp = vi.fn();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await troll["moveAlongPath"](path);
        expect(troll.moveUp).toHaveBeenCalledTimes(1);
    })
    it('should move along path left', async () => {
        const troll = new Troll(mockCell, mockBoard);
        const path = 'left';
        troll.moveLeft = vi.fn();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await troll["moveAlongPath"](path);
        expect(troll.moveLeft).toHaveBeenCalledTimes(1);
    })
    it('should move along path right', async () => {
        const troll = new Troll(mockCell, mockBoard);
        const path = 'right';
        troll.moveRight = vi.fn();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await troll["moveAlongPath"](path);
        expect(troll.moveRight).toHaveBeenCalledTimes(1);
    })
});