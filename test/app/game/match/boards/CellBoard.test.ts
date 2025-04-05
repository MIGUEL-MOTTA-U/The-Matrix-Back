import { describe, it, expect } from 'vitest';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import BoardDifficulty1 from '../../../../../src/app/game/match/boards/BoardDifficulty1.js';
import Fruit from '../../../../../src/app/game/match/boards/Fruit.js';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';


describe('Cell', () => {
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
        const board = new BoardDifficulty1("desert", 1);
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
        const board = new BoardDifficulty1("desert", 1);
        const cell = new Cell(1, 1);
        const troll = board.getBoard()[2][4].getCharacter();
        cell.setCharacter(troll);
        expect(troll).toBeInstanceOf(Troll);
        expect(cell.getCharacter()).toBeInstanceOf(Troll);
    });
});