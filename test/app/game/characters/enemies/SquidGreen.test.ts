import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Cell from '../../../../../src/app/game/match/boards/CellBoard.js';
import { mockDeep } from 'vitest-mock-extended';
import type Board from '../../../../../src/app/game/match/boards/Board.js';
import SquidGreen from '../../../../../src/app/game/characters/enemies/SquidGreen.js';
import type { CellDTO } from '../../../../../src/schemas/zod.js';

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

describe('Squid Green tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should calculate movement successfully', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        
        // Mock execPower to return unfrozen cells
        const mockUnfrozenCells= [{ x: 1, y: 1, frozen: false }];
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["execPower"] = vi.fn().mockResolvedValue(mockUnfrozenCells);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["notifyPlayers"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["moveAlongPath"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["getCharacterUpdate"] = vi.fn().mockReturnValue({ id: 'squid-id' });
        
        await squid.calculateMovement();
        
        expect(mockBoard.getBestDirectionToPlayers).toHaveBeenCalledWith(mockCell, true);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["execPower"]).toHaveBeenCalled();
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["notifyPlayers"]).toHaveBeenCalledWith('update-frozen-cells', mockUnfrozenCells);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["moveAlongPath"]).toHaveBeenCalledWith('down');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["notifyPlayers"]).toHaveBeenCalledWith('update-enemy', { id: 'squid-id' });
    });

    it('should not notify players when no cells are unfrozen', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        
        // Mock execPower to return empty array (no unfrozen cells)
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["execPower"] = vi.fn().mockResolvedValue([]);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["notifyPlayers"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["moveAlongPath"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["getCharacterUpdate"] = vi.fn().mockReturnValue({ id: 'squid-id' });
        
        await squid.calculateMovement();
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["notifyPlayers"]).not.toHaveBeenCalledWith('update-frozen-cells', []);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["moveAlongPath"]).toHaveBeenCalledWith('down');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["notifyPlayers"]).toHaveBeenCalledWith('update-enemy', { id: 'squid-id' });
    });

    it('should use orientation when getBestDirectionToPlayers returns null', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue(null);
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["orientation"] = "right";
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["execPower"] = vi.fn().mockResolvedValue([]);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["notifyPlayers"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["moveAlongPath"] = vi.fn().mockResolvedValue(undefined);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["getCharacterUpdate"] = vi.fn().mockReturnValue({ id: 'squid-id' });
        
        await squid.calculateMovement();
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["moveAlongPath"]).toHaveBeenCalledWith("right");
    });

    it('should handle error when execPower throws', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["id"] = "test-squid-id";
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        
        const mockError = new Error('Power execution error');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["execPower"] = vi.fn().mockRejectedValue(mockError);
        
        await squid.calculateMovement();
        
        expect(squid.getEnemyState()).toBe('stopped');
        const { logger } = await import('../../../../../src/server.js');
        expect(logger.debug).toHaveBeenCalledWith(
            `SquidGreen test-squid-id cannot move in the direction down. Error: ${mockError}`
        );
    });

    it('should handle error when moveAlongPath throws', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["id"] = "test-squid-id";
        mockBoard.getBestDirectionToPlayers.mockReturnValue('down');
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["execPower"] = vi.fn().mockResolvedValue([]);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["notifyPlayers"] = vi.fn().mockResolvedValue(undefined);
        
        const mockError = new Error('Movement error');
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["moveAlongPath"] = vi.fn().mockRejectedValue(mockError);
        
        await squid.calculateMovement();
        
        expect(squid.getEnemyState()).toBe('stopped');
        const { logger } = await import('../../../../../src/server.js');
        expect(logger.debug).toHaveBeenCalledWith(
            `SquidGreen test-squid-id cannot move in the direction down. Error: ${mockError}`
        );
    });

    it('should execute power and unfreeze cells around', async () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        const mockUnfrozenCells = [{ x: 1, y: 1, frozen: false }];
        
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        squid["cell"].unfreezeCellsAround = vi.fn().mockReturnValue(mockUnfrozenCells);
        
        const result = await squid.execPower();
        
        expect(result).toEqual(mockUnfrozenCells);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(squid["cell"].unfreezeCellsAround).toHaveBeenCalled();
    });

    it('should return enemy name', () => {
        const squid = new SquidGreen(mockCell, mockBoard);
        expect(squid.getEnemyName()).toBe('squid-green');
    });
});