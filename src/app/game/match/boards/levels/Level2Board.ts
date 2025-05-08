import { config } from '../../../../../server.js';
import Cow from '../../../characters/enemies/Cow.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import type Match from '../../Match.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';

/**
 * @class Level3Board
 * @extends Board
 * Class representing the board for level 3.
 *
 * @since 07/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Level2Board extends Board {
  constructor(match: Match, map: string, level: number) {
    super(match, map, level);
    this.loadContext(); // We exec this method twice, because of TypeScript, it doesn't saves the status assigned after we use the father constructor:)
  }

  protected getBoardEnemy(cell: Cell): Enemy {
    return new Cow(cell, this);
  }

  protected loadContext(): void {
    this.playersStartCoordinates = [
      [9, 1],
      [9, 14],
    ];
    this.enemiesCoordinates = [
      [2, 3],
      [2, 12],
      [13, 3],
      [13, 12],
    ];
    this.fruitsCoordinates = [
      [1, 1],
      ...this.getRowCoordinatesInRange(1, 4, 11),
      [1, 14],
      ...this.getRowCoordinatesInRange(4, 4, 11),
      ...this.getRowCoordinatesInRange(11, 4, 11),
      [14, 1],
      ...this.getRowCoordinatesInRange(14, 4, 11),
      [14, 14],
    ];
    this.rocksCoordinates = [
      ...this.getRowCoordinatesInRange(5, 1, 4),
      ...this.getRowCoordinatesInRange(5, 11, 14),
      ...this.getSquareCoordinatesInRange(4, 6, 6, 9),
      ...this.getRowCoordinatesInRange(10, 1, 4),
      ...this.getRowCoordinatesInRange(10, 11, 14),
    ];
    this.FRUIT_TYPE = ['banana', 'grape'];
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS;
    this.loadConstants();
  }
}
