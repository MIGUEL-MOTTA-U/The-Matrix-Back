import { config } from '../../../../../server.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import SquidGreen from '../../../characters/enemies/SquidGreen.js';
import type Match from '../../Match.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';

/**
 * @class Level4Board
 * @extends Board
 * Class representing the board for level 4.
 *
 * @since 07/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Level4Board extends Board {
  /*
   * The default enemy for this level is a SquidGreen.
   */
  protected getBoardEnemy(cell: Cell): Enemy {
    return new SquidGreen(cell, this);
  }
  protected loadContext(): void {
    this.playersStartCoordinates = [
      [7, 1],
      [7, 14],
    ];

    this.enemiesCoordinates = [
      [4, 4],
      [4, 11],
      [11, 4],
      [11, 11],
    ];

    this.fruitsCoordinates = [
      [0, 2],
      ...this.getRowCoordinatesInRange(0, 6, 9),
      [0, 13],
      ...this.getRowCoordinatesInRange(3, 5, 10),
      ...this.getRowCoordinatesInRange(7, 7, 8),
      ...this.getRowCoordinatesInRange(8, 7, 8),
      ...this.getRowCoordinatesInRange(12, 5, 10),
      ...this.getRowCoordinatesInRange(15, 5, 10),
    ];

    this.freezedCells = [
      [0, 4],
      [0, 11],
      [1, 0],
      [1, 15],
      [3, 0],
      [3, 15],

      ...this.getSquareCoordinatesInRange(2, 5, 7, 8),
      ...this.getSquareCoordinatesInRange(2, 7, 5, 6),
      ...this.getSquareCoordinatesInRange(2, 7, 9, 10),
      ...this.getSquareCoordinatesInRange(2, 9, 7, 8),

      [13, 0],
      [13, 15],
      [15, 0],
      [15, 15],
      [15, 4],
      [15, 11],
    ];
    this.rocksCoordinates = [
      ...this.getRowCoordinatesInRange(1, 1, 14),
      ...this.getColCoordinatesInRange(1, 2, 3),
      ...this.getColCoordinatesInRange(14, 2, 3),
      ...this.getColCoordinatesInRange(1, 12, 13),
      ...this.getColCoordinatesInRange(14, 12, 13),
      ...this.getRowCoordinatesInRange(14, 1, 14),
    ];
    this.FRUIT_TYPE = ['grape', 'apple'];
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS;
    this.loadConstants();
  }
}
