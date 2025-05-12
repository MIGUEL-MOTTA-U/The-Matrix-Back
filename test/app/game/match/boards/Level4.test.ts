import Level4Board from '../../../../../src/app/game/match/boards/levels/Level4Board.js';
import type Match from '../../../../../src/app/game/match/Match.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import SquidGreen from '../../../../../src/app/game/characters/enemies/SquidGreen.js';

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

const { match, map, level } = { match: mockDeep<Match>(), map: 'island', level: 4 };
let boardMock: Level4Board;

describe('Level4Board', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('created correctly as expected', () => {
        it('should set up fruits', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            boardMock.initialize(); // Called twice to match pattern in other tests
            const fruits = boardMock.getFruitsNumber();
            // Count based on the coordinates in Level4Board loadContext
            expect(fruits).toBeGreaterThan(0);
        });

        it('should set up rocks', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const rocks = boardMock["ROCKS"];
            // Based on rocksCoordinates length from Level4Board
            expect(rocks).toBeGreaterThan(0);
        });

        it('should set up enemies', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesCoordinates = boardMock["enemiesCoordinates"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemies = boardMock["NUMENEMIES"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemyType = boardMock["getBoardEnemy"](boardMock.getBoard()[4][4]);
            
            expect(enemiesCoordinates).toEqual([[4, 4], [4, 11], [11, 4], [11, 11]]);
            expect(enemies).toEqual(4);
            expect(enemyType).toBeInstanceOf(SquidGreen);
        });

        it('should set up players', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const players = boardMock["playersStartCoordinates"];
            expect(players).toEqual([[7, 1], [7, 14]]);
        });

        it('should set up freezed cells', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const freezedCells = boardMock["freezedCells"];
            // Check a few key positions to verify setup
            expect(freezedCells).toContainEqual([0, 4]);
            expect(freezedCells).toContainEqual([15, 15]);
            expect(freezedCells.length).toBeGreaterThan(10);
        });

        it('should set up fruits type', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsType = boardMock["FRUITS_CONTAINER"]
            expect(fruitsType).toEqual(['grape', 'apple']);
        });

        it('should set up enemies speed', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesSpeed = boardMock["ENEMIES_SPEED"];
            // In Level4Board, speed is directly config.ENEMIES_SPEED_MS
            expect(enemiesSpeed).toEqual(1000);
        });

        it('should set up fruit rounds', () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsRounds = boardMock["fruitsRounds"];
            // fruitsRounds equals FRUIT_TYPE.length - 1
            expect(fruitsRounds).toEqual(2 - 1);
        });

        it('should handle enemy movement', async () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            const enemy = boardMock.getBoard()[4][4].getCharacter() as SquidGreen;
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkLose"] = vi.fn().mockReturnValue(false);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkWin"] = vi.fn().mockReturnValue(false);

            enemy.calculateMovement = vi.fn().mockResolvedValue(undefined);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            await boardMock["handleEnemyMovement"](enemy);
            
            expect(enemy.calculateMovement).toHaveBeenCalled();
        });


        it('should call stopGame when checkLose is true', async () => {
            boardMock = new Level4Board(match, map, level);
            boardMock.initialize();
            const enemyMock = mockDeep<SquidGreen>();
            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkLose"] = vi.fn().mockReturnValue(true);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkWin"] = vi.fn().mockReturnValue(false);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["stopGame"] = vi.fn().mockResolvedValue(undefined);            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            await boardMock["handleEnemyMovement"](enemyMock as unknown as SquidGreen);
            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["checkLose"]).toHaveBeenCalled();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["stopGame"]).toHaveBeenCalled();
        });
    });
});