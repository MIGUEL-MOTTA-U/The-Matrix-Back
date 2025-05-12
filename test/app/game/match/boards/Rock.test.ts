import type Board from '../../../../../src/app/game/match/boards/Board.js';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import Rock from '../../../../../src/app/game/match/boards/Rock.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
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
const mockBoard = mockDeep<Board>();
describe('Rock tests',  () => {
    it('should not pick',async () => {
        const cell = new Cell(2,2);
        const rock = new Rock(cell, mockBoard);
        await expect(rock.pick()).resolves.toEqual(undefined);
    })

    it('should block movement',() => {
        const cell = new Cell(2,2);
        const rock = new Rock(cell, mockBoard);
        expect(rock.blocked()).toEqual(true);
    });

    it('should get DTO', () => {
        const cell = new Cell(2,2);
        const rock = new Rock(cell, mockBoard);
        const dto = rock.getDTO();
        expect(dto).toEqual({
            type: 'rock',
            id: rock.getId(),
        });
    })
});