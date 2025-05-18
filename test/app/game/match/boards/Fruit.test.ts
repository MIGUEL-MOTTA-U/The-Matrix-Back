import { describe, it, expect, beforeEach, vi } from "vitest";
import Fruit from "../../../../../src/app/game/match/boards/Fruit.js";
import Cell from "../../../../../src/app/game/match/boards/CellBoard.js";
import type Level1Board from "../../../../../src/app/game/match/boards/levels/Level1Board.js";
import { mockDeep, mockReset } from "vitest-mock-extended";

vi.mock('../../../../../src/server.js', () => {
    return {
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            debug: vi.fn(),
            error: vi.fn(),
        },
        config: {
            game: {
                board: {
                    rows: 5,
                    cols: 5,
                },
                fruits: {
                    number: 3,
                },
            },
        },
    };
});

describe('Fruit', () => {
    const board = mockDeep<Level1Board>();
    beforeEach(() => {
        mockReset(board);
    })
    it('should pick a fruit', async () => {
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        const id = await fruit.pick();
        expect(board.removeFruit).toHaveBeenCalled();
        expect(cell.getItem()).toBeNull();
        expect(fruit.getId()).toBe(id);
    });

    it('should not block', () => {
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        expect(fruit.blocked()).toBeFalsy();
    });

    it('should pick a fruit', () => {
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        expect(fruit.getName()).toBe('apple');
    });
    
    it('should return DTO ', () => {
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        const dto = fruit.getDTO();
        expect(dto).toEqual({
            id: fruit.getId(),
            type: 'fruit',
        });
    })

});
