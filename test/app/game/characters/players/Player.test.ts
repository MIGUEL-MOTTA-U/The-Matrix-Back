import { describe, it, expect, vi, beforeEach } from 'vitest';
import Player from '../../../../../src/app/game/characters/players/Player.js';
import Level1Board from '../../../../../src/app/game/match/boards/levels/Level1Board.js';
import Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import CharacterError from '../../../../../src/errors/CharacterError.js';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type Match from '../../../../../src/app/game/match/Match.js';
import type { Graph } from '../../../../../src/utils/Graph.js';

vi.mock('../../../../../src/server.js', () => {
    return {
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
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

describe('Player', () => {
    const match = mockDeep<Match>();
    
    beforeEach(() => {
        mockReset(match);
    });

    it('should create a player', () => {
        const board = new Level1Board(match, 'map', 1);
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-1');
        expect(player).toBeDefined();
        expect(player.getId()).toBe('id-player-test-1');
        expect(player.getCoordinates()).toStrictEqual(cell.getCoordinates());
    })

    it('player should not kill', () => {
        const board = new Level1Board(match,'map', 1);
        board.initialize();
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-2');
        expect(player.kill()).toBeFalsy();
    })

    it('player should die', () => {
        const board = new Level1Board(match,'map', 1);
        board.initialize();
        const cell = new Cell(1, 1);
        const player = new Player(cell, board, 'id-player-test-3');
        player.die();
        expect(player.die()).toBeTruthy();
    });

    it('player should move left',async () => {
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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
        const board = new Level1Board(match,'map', 1);
        board.initialize();
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


    describe('color methods', () => {
        it('should get player color', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            expect(player.getColor()).toBe('brown');

            player.setColor('blue');
            expect(player.getColor()).toBe('blue');
        });
    });

    describe('orientation methods', () => {
        it('should get and change orientation', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            expect(player.getOrientation()).toBe('down');

            player.changeOrientation('up');
            expect(player.getOrientation()).toBe('up');

            player.changeOrientation('left');
            expect(player.getOrientation()).toBe('left');

            player.changeOrientation('right');
            expect(player.getOrientation()).toBe('right');
        });

        it('should return update data when changing orientation', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            const updateData = player.changeOrientation('up');
            
            expect(updateData).toBeDefined();
            expect(updateData.coordinates).toEqual(cell.getCoordinates());
            expect(updateData.direction).toBe('up');
        });
    });

    describe('state methods', () => {
        it('should get character state', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            expect(player.getState()).toBe('alive');
            
            player.setColor('green');
            expect(player.getCharacterState()).toEqual({
                id: 'id-player-test',
                state: 'alive',
                color: 'green'
            });

            player.die();
            expect(player.getState()).toBe('dead');
            expect(player.getCharacterState()).toEqual({
                id: 'id-player-test',
                state: 'dead',
                color: 'green'
            });
        });
    });

    describe('reborn method', () => {
        it('should reborn a dead player', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            player.die();
            expect(player.isAlive()).toBe(false);
            
            player.reborn();
            expect(player.isAlive()).toBe(true);
        });
    });

    describe('pathfinding methods', () => {
        it('should get shortest path to character', () => {
            const board = new Level1Board(match, 'map', 1);
            const sourceCell = new Cell(1, 1);
            const targetCell = new Cell(3, 3);
            const player = new Player(sourceCell, board, 'id-player-test');
            
            const mockGraph = mockDeep<Graph>();
            mockGraph.shortestPathDijkstra.mockReturnValue({
                distance: 4,
                path: ['1,1', '2,1', '2,2', '3,2', '3,3']
            });
            
            const result = player.getShortestPathToCharacter(targetCell, mockGraph);
            
            expect(result).toEqual({
                distance: 4,
                path: [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 2, y: 2 },
                    { x: 3, y: 2 },
                    { x: 3, y: 3 }
                ]
            });
            
            expect(mockGraph.shortestPathDijkstra).toHaveBeenCalledWith('3,3', '1,1');
        });

        it('should get shortest direction to character', () => {
            const board = new Level1Board(match, 'map', 1);
            const sourceCell = new Cell(1, 1);
            const targetCell = new Cell(2, 1);
            const player = new Player(sourceCell, board, 'id-player-test');
            
            const mockGraph = mockDeep<Graph>();
            mockGraph.shortestPathDijkstra.mockReturnValue({
                distance: 1,
                path: ['2,1', '1,1']
            });
            
            vi.spyOn(targetCell, 'getDirection').mockReturnValue('down');
            
            const result = player.getShortestDirectionToCharacter(targetCell, mockGraph);
            
            expect(result).toEqual({
                distance: 1,
                path: [{x: 2, y: 1}, {x: 1, y: 1}],
                direction: 'down'
            });
        });

        it('should return null when no path exists', () => {
            const board = new Level1Board(match, 'map', 1);
            const sourceCell = new Cell(1, 1);
            const targetCell = new Cell(2, 1);
            const player = new Player(sourceCell, board, 'id-player-test');
            
            const mockGraph = mockDeep<Graph>();
            mockGraph.shortestPathDijkstra.mockReturnValue({
                distance: 0,
                path: ['2,1']
            });
            
            const result = player.getShortestDirectionToCharacter(targetCell, mockGraph);
            
            expect(result).toBeNull();
        });
    });

    describe('BoardItem methods', () => {
        it('should not block cells', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            expect(player.blocked()).toBe(false);
        });

        it('should handle pick method', async () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            const result = await player.pick();
            expect(result).toBeUndefined();
        });
    });

    describe('get DTO', () => {
        it('should return the DTO of the player', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            const dto = player.getDTO();
            
            expect(dto).toEqual({
                type: 'player',
                id: 'id-player-test',
                orientation: 'down'
            });
        });

        it('should return player storage', () => {
            const board = new Level1Board(match, 'map', 1);
            const cell = new Cell(1, 1);
            const player = new Player(cell, board, 'id-player-test');
            
            const storage = player.getPlayerStorage();
            
            expect(storage).toEqual({
                id: 'id-player-test',
                color: 'brown',
                coordinates: { x: 1, y: 1 },
                direction: 'down',
                state: 'alive'
            });
        });
    })

    
});