import { config } from '../../../../../server.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import SquidBlue from '../../../characters/enemies/SquidBlue.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';

/**
 * @class Level5Board
 * @extends Board
 * Class representing the board for level 5.
 *
 * @since 07/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Level5Board extends Board {
  protected getBoardEnemy(cell: Cell): Enemy {
    return new SquidBlue(cell, this);
  }
  protected loadContext(): void {
    this.playersStartCoordinates = [
      [9, 1],
      [9, 14],
    ];
    this.enemiesCoordinates = [
      [7, 7],
      [7, 8],
      [8, 7],
      [8, 8],
    ];
    this.fruitsCoordinates = [
      [0, 7],
      [0, 9],
      [1, 6],
      [1, 8],
      [2, 7],
      [2, 9],
      [3, 6],
      [3, 8],

      ...this.getSquareCoordinatesInRange(2, 2, 1, 2),
      ...this.getSquareCoordinatesInRange(2, 2, 13, 14),

      [12, 2],
      [12, 13],

      ...this.getRowCoordinatesInRange(15, 7, 8),
    ];
    this.freezedCells = [
      [0, 6],
      [0, 8],
      [1, 7],
      [1, 9],
      [2, 6],
      [2, 8],
      [3, 7],
      [3, 9],

      ...this.getRowCoordinatesInRange(6, 6, 9),
      ...this.getColCoordinatesInRange(6, 7, 8),
      ...this.getColCoordinatesInRange(9, 7, 8),
      ...this.getRowCoordinatesInRange(9, 6, 9),

      ...this.getRowCoordinatesInRange(12, 3, 6),
      ...this.getRowCoordinatesInRange(12, 9, 12),
    ];
    this.rocksCoordinates = [];
    this.FRUIT_TYPE = ['grape', 'apple'];
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS;
    this.loadConstants();
  }
}
