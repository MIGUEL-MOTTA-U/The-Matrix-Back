import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import type Match from '../../../../src/app/game/match/Match.js';
import BoardFactory from '../../../../src/app/game/match/boards/BoardFactory.js';
import Level1Board from '../../../../src/app/game/match/boards/levels/Level1Board.js';
import Level2Board from '../../../../src/app/game/match/boards/levels/Level2Board.js';
import Level3Board from '../../../../src/app/game/match/boards/levels/Level3Board.js';
import Level4Board from '../../../../src/app/game/match/boards/levels/Level4Board.js';
import Level5Board from '../../../../src/app/game/match/boards/levels/Level5Board.js';
const mockMatch = mockDeep<Match>();
vi.mock('../../../../src/server.js', () => {
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

describe('Board Factory tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a Level1Board instance for level 1', () => {
        const board1 = BoardFactory.createBoard(mockMatch, 'map1', 1);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(board1["level"]).toBe(1);
        expect(board1).toBeInstanceOf(Level1Board);
    });

    it('should create a Level2Board instance for level 2', () => {
        const board2 = BoardFactory.createBoard(mockMatch, 'map2', 2);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(board2["level"]).toBe(2);
        expect(board2).toBeInstanceOf(Level2Board);
    });

    it('should create a Level3Board instance for level 3', () => {
        const board3 = BoardFactory.createBoard(mockMatch, 'map3', 3);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(board3["level"]).toBe(3);
        expect(board3).toBeInstanceOf(Level3Board);
    });

    it('should create a Level4Board instance for level 4', () => {
        const board4 = BoardFactory.createBoard(mockMatch, 'map4', 4);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(board4["level"]).toBe(4);
        expect(board4).toBeInstanceOf(Level4Board);
    });

    it('should create a Level5Board instance for level 5', () => {
        const board5 = BoardFactory.createBoard(mockMatch, 'map5', 5);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(board5["level"]).toBe(5);
        expect(board5).toBeInstanceOf(Level5Board);
    });

    it('should create a Level1Board instance for an unknown level', () => {
        for( let i = 6; i < 100; i++ ) {
            const board = BoardFactory.createBoard(mockMatch, 'map1', i);
            // biome-ignore lint/complexity/useLiteralKeys: <explanation>
            expect(board["level"]).toBe(i);
            expect(board).toBeInstanceOf(Level1Board);
        }
    });


});