import Level3Board from '../../../../../src/app/game/match/boards/levels/Level3Board.js';
import type Match from '../../../../../src/app/game/match/Match.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import LogMan from '../../../../../src/app/game/characters/enemies/LogMan.js';

vi.mock('../../../../../src/server.js', () => {
    return {
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        },
        config: {
            ENEMIES_SPEED_MS: 1000,
        },
    };
});

const { match, map, level } = { match: mockDeep<Match>(), map: 'forest', level: 3 };
let boardMock:Level3Board;
describe('Level3Board', () => {

    beforeEach( () => {
        vi.clearAllMocks();
    })

    describe('created correctly as expected', () => {
        it('should set up fruits', () => {
            boardMock = new Level3Board(match, map, level);
            boardMock.initialize();
            const fruits = boardMock.getFruitsNumber();
            // Count based on the coordinates in Level3Board loadContext
            expect(fruits).toBeGreaterThan(0);
        });

        it('should set up rocks', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const rocks = boardMock["ROCKS"];
            // Based on rocksCoordinates length from Level3Board
            expect(rocks).toBeGreaterThan(0);
        });

        it('should set up enemies', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesCoordinates = boardMock["enemiesCoordinates"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemies = boardMock["ENEMIES"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemyType = boardMock["getBoardEnemy"](boardMock.getBoard()[2][7]);
            expect(enemiesCoordinates).toEqual([[2, 7], [2, 8]]);
            expect(enemies).toEqual(2);
            expect(enemyType).toBeInstanceOf(LogMan);
        });

        it('should set up players', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const players = boardMock["playersStartCoordinates"];
            expect(players).toEqual([[10, 2], [10, 13]]);
        });

        it('should set up fruits type', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsType = boardMock["FRUIT_TYPE"];
            expect(fruitsType).toEqual(['banana', 'grape', 'apple']);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsContainer = boardMock["FRUITS_CONTAINER"];
            expect(fruitsContainer).toEqual(['banana', 'grape', 'apple']);
        });

        it('should set up enemies speed', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesSpeed = boardMock["ENEMIES_SPEED"];
            // In Level3Board, speed is config.ENEMIES_SPEED_MS + 500
            expect(enemiesSpeed).toEqual(1500);
        });

        it('should set up fruit rounds', () => {
            boardMock = new Level3Board(match, map, level);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsRounds = boardMock["fruitsRounds"];
            // fruitsRounds equals FRUIT_TYPE.length in Level3Board
            expect(fruitsRounds).toEqual(3);
        });

        it('should handle enemy movement', async () => {
            boardMock = new Level3Board(match, map, level);
            const enemy = boardMock.getBoard()[2][7].getCharacter() as LogMan;
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkLose"] = vi.fn().mockReturnValue(false);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkWin"] = vi.fn().mockReturnValue(false);

            enemy.calculateMovement = vi.fn().mockResolvedValue(undefined);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            await boardMock["handleEnemyMovement"](enemy);
        });

        it('should call stopGame when checkWin is true', async () => {
            boardMock = new Level3Board(match, map, level);
            const enemyMock = mockDeep<LogMan>();
            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkLose"] = vi.fn().mockReturnValue(false);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["checkWin"] = vi.fn().mockReturnValue(true);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            boardMock["stopGame"] = vi.fn().mockResolvedValue(undefined);            
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            await boardMock["handleEnemyMovement"](enemyMock as unknown as LogMan);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["checkWin"]).toHaveBeenCalled();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(boardMock["stopGame"]).toHaveBeenCalled();
        });
    });
});

