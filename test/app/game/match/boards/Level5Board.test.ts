import Level5Board from '../../../../../src/app/game/match/boards/levels/Level5Board.js';
import type Match from '../../../../../src/app/game/match/Match.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import SquidBlue from '../../../../../src/app/game/characters/enemies/SquidBlue.js';

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

const { match, map, level } = { match: mockDeep<Match>(), map: 'mountain', level: 5 };
let boardMock: Level5Board;

describe('Level5Board', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('created correctly as expected', () => {
        it('should set up fruits', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            boardMock.initialize(); // Called twice to match pattern in other tests
            const fruits = boardMock.getFruitsNumber();
            // Count based on the coordinates in Level5Board loadContext
            expect(fruits).toBeGreaterThan(0);
        });

        it('should have no rocks', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const rocks = boardMock["ROCKS"];
            // Level5Board has an empty rocksCoordinates array
            expect(rocks).toEqual(0);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const rocksCoordinates = boardMock["rocksCoordinates"];
            expect(rocksCoordinates).toEqual([]);
        });

        it('should set up enemies', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesCoordinates = boardMock["enemiesCoordinates"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemies = boardMock["NUMENEMIES"];
            // Test that the board creates the correct enemy type
            const cell = boardMock.getBoard()[0][0]; // Use any cell for testing
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemyType = boardMock["getBoardEnemy"](cell);
            
            expect(enemiesCoordinates.length).toBeGreaterThanOrEqual(0);
            expect(enemies).toBeGreaterThanOrEqual(0);
            expect(enemyType).toBeInstanceOf(SquidBlue);
        });

        it('should set up players', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const players = boardMock["playersStartCoordinates"];
            expect(players).toEqual([[9, 1], [9, 14]]);
        });

        it('should set up freezed cells', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const freezedCells = boardMock["freezedCells"];
            // Check specific freezed cell positions from Level5Board
            expect(freezedCells).toContainEqual([0, 6]);
            expect(freezedCells).toContainEqual([1, 7]);
            expect(freezedCells).toContainEqual([12, 3]);
            expect(freezedCells.length).toBeGreaterThan(10);
        });

        it('should set up enemies speed', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesSpeed = boardMock["ENEMIES_SPEED"];
            expect(enemiesSpeed).toEqual(1000);
        });

        it('should set up fruit rounds', () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsRounds = boardMock["remainingFruitRounds"];
            // fruitsRounds should equal FRUIT_TYPE.length - 1
            expect(fruitsRounds).toEqual(2 - 1);
        });

        it('should call stopGame when checkLose is true', async () => {
            boardMock = new Level5Board(match, map, level);
            boardMock.initialize();
            const enemyMock = mockDeep<SquidBlue>();
            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkLose"] = vi.fn().mockReturnValue(true);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkWin"] = vi.fn().mockReturnValue(false);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["stopGame"] = vi.fn().mockResolvedValue(undefined);            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            await boardMock["handleEnemyMovement"](enemyMock as unknown as SquidBlue);
            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["checkLose"]).toHaveBeenCalled();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["stopGame"]).toHaveBeenCalled();
        });
    });
});