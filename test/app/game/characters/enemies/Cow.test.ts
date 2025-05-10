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
        expect(cow["moveAlongPath"]).toHaveBeenCalled()
    })

    it('should calculate movement with default direction', async () => {
        const cow = new Cow(mockCell, mockBoard);
        mockBoard.getBestDirectionToPlayers.mockReturnValue(null);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        cow["moveAlongPath"] = vi.fn();
        await cow.calculateMovement();
        expect(mockBoard.getBestDirectionToPlayers).toHaveBeenCalledWith(mockCell, false);
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalled()
        // biome-ignore lint/complexity/useLiteralKeys: <explanation>
        expect(cow["moveAlongPath"]).toHaveBeenCalledWith(cow["orientation"]);
    })

    

    
});