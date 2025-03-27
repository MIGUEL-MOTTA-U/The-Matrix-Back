import { describe, it, expect } from "vitest";
import Fruit from "../../../../../src/app/game/match/boards/Fruit.js";
import Cell from "../../../../../src/app/game/match/boards/CellBoard.js";
import BoardDifficulty1 from "../../../../../src/app/game/match/boards/BoardDifficulty1.js";


describe('Fruit', () => {
    it('should pick a fruit', () => {
        const board = new BoardDifficulty1("desert", 1);
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        fruit.pick();
        expect(cell.getItem()).toBeNull();
    });

    it('should not block', () => {
        const board = new BoardDifficulty1("desert", 1);
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        expect(fruit.blocked()).toBeFalsy();
    });

    it('should pick a fruit', () => {
        const board = new BoardDifficulty1("desert", 1);
        const cell = new Cell(1,1);
        const fruit = new Fruit(cell, 'apple', board);
        expect(fruit.getName()).toBe('apple');
    });    

});
