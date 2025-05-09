import type { BoardItemDTO } from '../../../../schemas/zod.js';
import type Board from './Board.js';
import { BoardItem } from './BoardItem.js';
import type Cell from './CellBoard.js';
/**
 * @class Fruit
 * The responsibility of this class is to represent
 * the behaviour and properties of a fruit in the game.
 * It extends the BoardItem class and implements the pick method.
 * The fruit can be picked from the board, and it does not block movement.
 * @since 18/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Fruit extends BoardItem {
  /**
   * Converts the fruit into a BoardItemDTO object.
   *
   * @return {BoardItemDTO} An object representing the fruit.
   */
  getDTO(): BoardItemDTO {
    return { type: 'fruit', id: this.id };
  }

  /**
   * Indicates whether the fruit blocks the movement of a character.
   *
   * @return {boolean} False, as fruits do not block movement.
   */
  blocked(): boolean {
    return false;
  }

  /**
   * Picks the fruit from the board and removes it.
   *
   * @return {Promise<string>} A promise that resolves to the ID of the picked fruit.
   */
  async pick(): Promise<string> {
    this.board.removeFruit(this.cell.getCoordinates());
    return this.id;
  }

  private name: string;

  /**
   * Creates a new fruit instance.
   *
   * @param {Cell} cell The cell where the fruit is located.
   * @param {string} name The name of the fruit.
   * @param {Board} board The board to which the fruit belongs.
   */
  constructor(cell: Cell, name: string, board: Board, id?: string) {
    super(cell, board, id);
    this.name = name;
  }

  /**
   * Retrieves the name of the fruit.
   *
   * @return {string} The name of the fruit.
   */
  public getName(): string {
    return this.name;
  }
}
