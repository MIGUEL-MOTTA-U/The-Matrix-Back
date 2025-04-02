import type { BoardItemDTO } from '../../../../schemas/zod.js';
import type Board from './Board.js';
import { BoardItem } from './BoardItem.js';
import type Cell from './CellBoard.js';

export default class Fruit extends BoardItem {
  getDTO(): BoardItemDTO {
    return { type: 'fruit', id: this.id };
  }
  /**
   * The cell doesn't block the movement of the character
   * @returns False if the Item is a fruit
   */
  blocked(): boolean {
    return false;
  }

  pick(): void {
    this.board.removeFruit(this.cell.getCoordinates());
  }

  private name: string;
  constructor(cell: Cell, name: string, board: Board) {
    super(cell, board);
    this.name = name;
  }
  public getName(): string {
    return this.name;
  }
}
