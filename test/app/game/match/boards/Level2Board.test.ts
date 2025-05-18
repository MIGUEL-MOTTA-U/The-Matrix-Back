import Level2Board from '../../../../../src/app/game/match/boards/levels/Level2Board.js';
import type Match from '../../../../../src/app/game/match/Match.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Cow from '../../../../../src/app/game/characters/enemies/Cow.js';

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
}
);

const { match, map, level } = { match: mockDeep<Match>(), map: 'desert', level: 2 };
let boardMock:Level2Board;
describe('Level2Board', () => {

    beforeEach( () => {
        vi.clearAllMocks();
    })

    describe('created correctly as expected', () => {
        it('should set up fruits', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            boardMock.initialize();
            const fruits = boardMock.getFruitsNumber();
            expect(fruits).toEqual(36);
        });

        it('should set up rocks', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const rocks = boardMock["ROCKS"]
            expect(rocks).toEqual(32);
        });

        it('should set up enemies', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesCoordinates = boardMock["enemiesCoordinates"];
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemies = boardMock["NUMENEMIES"]
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemyType = boardMock["getBoardEnemy"](boardMock.getBoard()[2][3]);
            expect(enemiesCoordinates).toEqual([[2, 3], [2, 12], [13, 3], [13, 12]]);
            expect(enemies).toEqual(4);
            expect(enemyType).toBeInstanceOf(Cow)
        })

        it('should set up players', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const players = boardMock["playersStartCoordinates"]
            expect(players).toEqual([[9, 1], [9, 14]]);
        });

        it('should set up fruits type', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsType = boardMock["FRUIT_TYPE"]
            expect(fruitsType).toEqual(['grape']);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const fruitsContainer = boardMock["FRUITS_CONTAINER"]
            expect(fruitsContainer).toEqual(['banana', 'grape']);
        })

        it('should set up enemies speed', () => {
            boardMock = new Level2Board(match, map, level);
            boardMock.initialize();
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            const enemiesSpeed = boardMock["ENEMIES_SPEED"]
            expect(enemiesSpeed).toEqual(1000);
        })


    })
});