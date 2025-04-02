import { v4 as uuidv4 } from 'uuid';
import type { BoardItemDTO } from '../../../../schemas/zod.js';
import type Board from './Board.js';
import type Cell from './CellBoard.js';

export abstract class BoardItem {
  protected cell: Cell;
  protected board: Board;
  protected id: string;
  abstract blocked(): boolean;
  abstract pick(): void;
  abstract getDTO(): BoardItemDTO;
  constructor(cell: Cell, board: Board, id?: string) {
    this.cell = cell;
    this.board = board;
    this.id = id || uuidv4();
  }
}
