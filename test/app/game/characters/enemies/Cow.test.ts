import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import { mockDeep } from 'vitest-mock-extended';
import type Board from '../../../../../src/app/game/match/boards/Board.js';
import Cow from '../../../../../src/app/game/characters/enemies/Cow.js';
const mockCell = mockDeep<Cell>();
const mockBoard = mockDeep<Board>();

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

describe('Cow tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate movement', async () => {
        const cow = new Cow(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["moveAlongPath"] = vi.fn();
        await cow.calculateMovement();
        expect(mockBoard.getBestDirectionToPlayers).toHaveBeenCalledWith(mockCell, false);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalled();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalledWith('down');
    });

    it('should calculate movement with default direction', async () => {
        const cow = new Cow(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue(null);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["moveAlongPath"] = vi.fn();
        await cow.calculateMovement();
        expect(mockBoard.getBestDirectionToPlayers).toHaveBeenCalledWith(mockCell, false);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalled();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalledWith(cow["orientation"]);
    });

    it('should handle error when moveAlongPath throws', async () => {
        const cow = new Cow(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["id"] = "test-cow-id";
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["orientation"] = "right";
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        
        const mockError = new Error('Movement error');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["moveAlongPath"] = vi.fn().mockRejectedValue(mockError);
        
        await cow.calculateMovement();
        
        expect(cow.getEnemyState()).toBe('stopped');
        const { logger } = await import('../../../../../src/server.js');
        expect(logger.debug).toHaveBeenCalledWith(
            `Cow test-cow-id cannot move in the direction down. Error: ${mockError}`
        );
    });

    it('should handle error when getBestDirectionToPlayers returns null and moveAlongPath throws', async () => {
        const cow = new Cow(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["id"] = "test-cow-id";
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["orientation"] = "right";
        mockBoard.getBestDirectionToPlayers.mockReturnValue(null);
        
        const mockError = new Error('Movement error');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["moveAlongPath"] = vi.fn().mockRejectedValue(mockError);
        
        await cow.calculateMovement();
        
        expect(cow.getEnemyState()).toBe('stopped');
        const { logger } = await import('../../../../../src/server.js');
        expect(logger.debug).toHaveBeenCalledWith(
            `Cow test-cow-id cannot move in the direction right. Error: ${mockError}`
        );
    });

    it('should return name', () => {
        const cow = new Cow(mockCell, mockBoard);
        expect(cow.getEnemyName()).toBe('cow');
    });
});