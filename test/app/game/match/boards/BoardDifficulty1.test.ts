import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import BoardDifficulty1 from '../../../../../src/app/game/match/boards/BoardDifficulty1.js';
import Fruit from '../../../../../src/app/game/match/boards/Fruit.js';
import { describe, it, expect } from 'vitest';
import Troll from '../../../../../src/app/game/characters/enemies/Troll.js';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { beforeEach } from 'node:test';
import type Match from '../../../../../src/app/game/match/Match.js';

describe('Board', () => {
    const match = mockDeep<Match>();

    beforeEach(() => {
        mockReset(match)
    })

    it('should generate the board', async () => {
        const board = new BoardDifficulty1(match,"desert", 1)
        await board.initialize();
        const cellsBoard = board.getBoard();
        expect(cellsBoard).toHaveLength(16);
        expect(cellsBoard[0]).toHaveLength(16);
        for(let i = 0; i < 16; i++){
            for(let j = 0; j < 16; j++){
                expect(cellsBoard[i][j]).toBeInstanceOf(Cell);
            }
        }
    });

    it('should generate the enemies',async () => {
        const board = new BoardDifficulty1(match,"desert", 1)
        await board.initialize();
        const enemies = board.getEnemies();
        expect(enemies).toHaveLength(4);
        const enemy1 = board.getBoard()[2][4].getCharacter();
        const enemy2 = board.getBoard()[2][12].getCharacter();
        const enemy3 = board.getBoard()[14][4].getCharacter();
        const enemy4 = board.getBoard()[14][12].getCharacter();
        expect(enemy1).toBeInstanceOf(Troll);
        expect(enemy2).toBeInstanceOf(Troll);
        expect(enemy3).toBeInstanceOf(Troll);
        expect(enemy4).toBeInstanceOf(Troll);
    });

    it('should remove a fruit',async () => {
        const board = new BoardDifficulty1(match,"desert", 1);
        await board.initialize();
        expect(board.getBoard()[4][10].getItem()).toBeInstanceOf(Fruit);
        await board.removeFruit({ x: 4, y: 10 });
        expect(board.getBoard()[4][10].getItem()).toBeNull();
        expect(board.getFruitsNumber()).toBe(13);
    })

    it('should set up players', async () => {
        const board = new BoardDifficulty1(match,"desert", 1);
        await board.initialize();
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        expect(board.getBoard()[9][1].getCharacter()).toBe(board.getHost());
        expect(board.getBoard()[9][1].getCharacter() !== null).toBeTruthy();
        expect(board.getBoard()[9][14].getCharacter() !== null).toBeTruthy();
        expect(board.getBoard()[9][14].getCharacter()).toBe(board.getGuest());
    })
    
});