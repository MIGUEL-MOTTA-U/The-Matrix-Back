import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import { mockDeep } from 'vitest-mock-extended';
import type Board from '../../../../../src/app/game/match/boards/Board.js';
import LogMan from '../../../../../src/app/game/characters/enemies/LogMan.js';
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
});

describe('LogMan tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should calculate movement with only guest path', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockGuestPath = {
            direction: 'down',
            distance: 4,
            path: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 0, y: 3 }
            ]
        };
        
        mockBoard.getPlayersPaths.mockReturnValue({
            hostPath: null,
            guestPath: mockGuestPath
        });
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["rollToDirection"] = vi.fn().mockResolvedValue(undefined);
        
        await logMan.calculateMovement();
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["rollToDirection"]).toHaveBeenCalledWith('down', 4);
    });

    it('should use orientation when no paths are available', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["orientation"] = "left";
        
        mockBoard.getPlayersPaths.mockReturnValue({
            hostPath: null,
            guestPath: null
        });
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["rollToDirection"] = vi.fn().mockResolvedValue(undefined);
        
        await logMan.calculateMovement();
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["rollToDirection"]).toHaveBeenCalledWith('left');
    });

    it('should roll to direction for specified number of times', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["id"] = "test-logman-id";
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["moveAlongPath"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["getCharacterUpdate"] = vi.fn().mockReturnValue({ id: 'test-logman-id' });
        mockBoard.notifyPlayers.mockResolvedValue(undefined);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await logMan["rollToDirection"]("right", 3);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["moveAlongPath"]).toHaveBeenCalledTimes(3);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["orientation"]).toBe("right");
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["enemyState"]).toBe("stopped");
    });

    it('should handle error during roll to direction', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["id"] = "test-logman-id";
        
        const mockError = new Error('Movement error');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["moveAlongPath"] = vi.fn().mockRejectedValue(mockError);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        await logMan["rollToDirection"]("right", 3);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["moveAlongPath"]).toHaveBeenCalledTimes(1);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["enemyState"]).toBe("stopped");
        
        const { logger } = await import('../../../../../src/server.js');
        expect(logger.debug).toHaveBeenCalledWith(
            `LogMan test-logman-id cannot move in the direction right. Error: ${mockError}`
        );
    });

    it('should calculate best straight path when both host and guest paths exist', () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockHostPath = {
            direction: 'right',
            distance: 3,
            path: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 }
            ]
        };
        
        const mockGuestPath = {
            direction: 'down',
            distance: 2,
            path: [
                { x: 0, y: 0 },
                { x: 0, y: 1 }
            ]
        };
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const result = logMan["calculateBestStraightPath"](mockHostPath, mockGuestPath);
        
        expect(result).toBeDefined();
        expect(result?.direction).toBe('down');
        expect(result?.path.length).toBe(2);
    });

    it('should calculate coordinates straight path correctly for vertical path', () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockPathDirection = {
            direction: 'up',
            distance: 4,
            path: [
                { x: 5, y: 5 },
                { x: 5, y: 4 },
                { x: 5, y: 3 },
                { x: 5, y: 2 },
                { x: 6, y: 1 } // This one breaks the straight line
            ]
        };
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const result = logMan["calculateCoordinatesStraightPath"](mockPathDirection);
        
        expect(result.length).toBe(4);
        expect(result).toEqual([
            { x: 5, y: 5 },
            { x: 5, y: 4 },
            { x: 5, y: 3 },
            { x: 5, y: 2 }
        ]);
    });

    it('should calculate coordinates straight path correctly for horizontal path', () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockPathDirection = {
            direction: 'right',
            distance: 3,
            path: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 1 }  // This one breaks the straight line
            ]
        };
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const result = logMan["calculateCoordinatesStraightPath"](mockPathDirection);
        
        expect(result.length).toBe(3);
        expect(result).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 }
        ]);
    });

    it('should handle empty path when calculating coordinates straight path', () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockPathDirection = {
            direction: 'right',
            distance: 0,
            path: []
        };
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        const result = logMan["calculateCoordinatesStraightPath"](mockPathDirection);
        
        expect(result.length).toBe(0);
        expect(result).toEqual([]);
    });

    it('should return enemy name', () => {
        const logMan = new LogMan(mockCell, mockBoard);
        expect(logMan.getEnemyName()).toBe('log-man');
    });

    it('should calculate movement with only host path', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockHostPath = {
            direction: 'up',
            distance: 2,
            path: [
                { x: 0, y: 0 },
                { x: 0, y: 1 }
            ]
        };
        
        mockBoard.getPlayersPaths.mockReturnValue({
            hostPath: mockHostPath,
            guestPath: null
        });
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["rollToDirection"] = vi.fn().mockResolvedValue(undefined);
        
        await logMan.calculateMovement();
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["rollToDirection"]).toHaveBeenCalledWith('up', 2);
    });

    it('should calculate movement with host and guest paths', async () => {
        const logMan = new LogMan(mockCell, mockBoard);
        
        const mockHostPath = {
            direction: 'right',
            distance: 3,
            path: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 }
            ]
        };
        
        const mockGuestPath = {
            direction: 'left',
            distance: 5,
            path: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 0 },
                { x: 4, y: 0 }
            ]
        };
        
        mockBoard.getPlayersPaths.mockReturnValue({
            hostPath: mockHostPath,
            guestPath: mockGuestPath
        });
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        logMan["rollToDirection"] = vi.fn().mockResolvedValue(undefined);
        
        await logMan.calculateMovement();
        
        expect(mockBoard.getPlayersPaths).toHaveBeenCalledWith(mockCell, false);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(logMan["rollToDirection"]).toHaveBeenCalledWith('right', 3);
    });
});