import { describe, it, expect, vi } from 'vitest';
import Player from '../../../../../src/app/game/characters/players/Player.js';
import BoardDifficulty1 from '../../../../../src/app/game/match/boards/BoardDifficulty1.js';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import CharacterError from '../../../../../src/errors/CharacterError.js';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type Match from '../../../../../src/app/game/match/Match.js';
import { beforeEach } from 'node:test';

describe('Player', () => {
    const match = mockDeep<Match>();
    
    beforeEach(() => {
        mockReset(match);
    })

    it('should create a player', () => {
        const board = new BoardDifficulty1(match, 'map', 1);
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-1');
        expect(player).toBeDefined();
        expect(player.getId()).toBe('id-player-test-1');
        expect(player.getCoordinates()).toStrictEqual(cell.getCoordinates());
    })

    it('player should not kill', () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-2');
        expect(player.kill()).toBeFalsy();
    })

    it('player should die', () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-3');
        player.die();
        expect(player.die()).toBeFalsy();
    });

    it('player should move left',async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[9][0].getCharacter()).toBeNull();
        await player?.moveLeft();
        expect(board.getBoard()[9][1].getCharacter()).toBeNull();
        expect(board.getBoard()[9][0].getCharacter()).toBe(player);
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 0 });
    })

    it('player should move right',async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[9][2].getCharacter()).toBeNull();
        await player?.moveRight();
        expect(board.getBoard()[9][1].getCharacter()).toBeNull();
        expect(board.getBoard()[9][2].getCharacter()).toBe(player);
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 2 });
    })

    it('player should move up',async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[8][1].getCharacter()).toBeNull();
        await player?.moveUp();
        expect(board.getBoard()[9][1].getCharacter()).toBeNull();
        expect(board.getBoard()[8][1].getCharacter()).toBe(player);
        expect(player?.getCoordinates()).toStrictEqual({ x: 8, y: 1 });
    })

    it('player should move down',async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[10][1].getCharacter()).toBeNull();
        await player?.moveDown();
        expect(board.getBoard()[9][1].getCharacter()).toBeNull();
        expect(board.getBoard()[10][1].getCharacter()).toBe(player);
        expect(player?.getCoordinates()).toStrictEqual({ x: 10, y: 1 });
    })

    it('should not move out the limits', async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        await player?.moveLeft();
        await expect(player?.moveLeft()).rejects.toBeInstanceOf(CharacterError);
    })

    it('should not move other player cell', async () => {
        const board = new BoardDifficulty1(match,'map', 1);
        const host = 'host';
        const guest = 'guest';
        await board.startGame(host, guest);
        const player = board.getHost();
        const player2 = board.getGuest();
        board.getBoard()[9][2].setCharacter(player2);
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[9][2].getCharacter()).toBe(player2);
        await expect(player?.moveRight()).rejects.toBeInstanceOf(CharacterError);
        expect(player?.getCoordinates()).toStrictEqual({ x: 9, y: 1 });
        expect(board.getBoard()[9][1].getCharacter()).toBe(player);
        expect(board.getBoard()[9][2].getCharacter()).toBe(player2);
    })
});