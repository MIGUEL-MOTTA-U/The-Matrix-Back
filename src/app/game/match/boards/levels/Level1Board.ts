import type { Direction } from '../../../../../schemas/zod.js';
import { config } from '../../../../../server.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import Troll from '../../../characters/enemies/Troll.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';
/**
 * @class Level1Board
 * Class to represent the board of the game
 * with a difficulty of 1 with troll enemies
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Level1Board extends Board {
  /**
   * This method return the enemy created in the board
   */
  protected getBoardEnemy(cell: Cell, id?: string, orientation?: Direction): Enemy {
    return new Troll(cell, this, id, undefined, orientation);
  }

  /**
   * This method generates the board with the map
   */
  protected loadContext(): void {
    this.playersStartCoordinates = [
      [9, 1],
      [9, 14],
    ];
    this.enemiesCoordinates = [
      [2, 4],
      [2, 12],
      [14, 4],
      [14, 12],
    ];
    this.fruitsCoordinates = [
      ...this.getRowCoordinatesInRange(4, 5, 11),
      ...this.getRowCoordinatesInRange(11, 5, 11),
    ];
    this.FRUIT_TYPE = ['banana', 'grape'];
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS;
    this.loadConstants();
  }
}
