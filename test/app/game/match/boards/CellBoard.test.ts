import { describe, it, expect, vi } from 'vitest';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import BoardDifficulty1 from '../../../../../src/app/game/match/boards/BoardDifficulty1.js';
import Fruit from '../../../../../src/app/game/match/boards/Fruit.js';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach } from 'node:test';
import type Match from '../../../../../src/app/game/match/Match.js';

vi.mock('../../../../../src/server.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));


describe('Cell', () => {
    const match = mockDeep<Match>();
    const board = new BoardDifficulty1(match, 'desert', 1);

    
    beforeEach(() => {
        mockReset(match);
    })

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
    })

    it('should pick a fruit', async () => {
        await board.initialize();
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
    })

    it('should set character', () => {
        const cell = new Cell(1, 1);
        const troll = board.getBoard()[2][4].getCharacter();
        cell.setCharacter(troll);
        expect(troll).toBeInstanceOf(Troll);
        expect(cell.getCharacter()).toBeInstanceOf(Troll);
    });
});