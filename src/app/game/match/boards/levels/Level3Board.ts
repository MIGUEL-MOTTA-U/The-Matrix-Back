import { config } from '../../../../../server.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import LogMan from '../../../characters/enemies/LogMan.js';
import type Match from '../../Match.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';

export default class Level3Board extends Board {
  constructor(match: Match, map: string, level: number) {
    super(match, map, level);
    this.loadContext(); // We exec this method twice, because of TypeScript, it doesn't saves the status assigned after we use the father constructor:)
  }

  protected getBoardEnemy(cell: Cell): Enemy {
    return new LogMan(cell, this);
  }

  protected loadContext(): void {
    this.playersStartCoordinates = [
      [10, 2],
      [10, 13],
    ];
    this.enemiesCoordinates = [
      [2, 7],
      [2, 8],
    ];
    this.fruitsCoordinates = [
      ...this.getRowCoordinatesInRange(3, 1, 2),
      ...this.getRowCoordinatesInRange(4, 1, 2),
      ...this.getRowCoordinatesInRange(3, 13, 14),
      ...this.getRowCoordinatesInRange(4, 13, 14),
      ...this.getRowCoordinatesInRange(5, 6, 9),
      ...this.getColCoordinatesInRange(7, 8, 10),
      ...this.getColCoordinatesInRange(8, 8, 10),
      ...this.getRowCoordinatesInRange(15, 6, 9),
    ];
    this.freezedCells = [
      ...this.getRowCoordinatesInRange(2, 0, 3),
      ...this.getRowCoordinatesInRange(2, 12, 15),
      ...this.getColCoordinatesInRange(0, 3, 4),
      ...this.getColCoordinatesInRange(3, 3, 4),
      ...this.getColCoordinatesInRange(12, 3, 4),
      ...this.getColCoordinatesInRange(15, 3, 4),
      ...this.getRowCoordinatesInRange(5, 0, 3),
      ...this.getRowCoordinatesInRange(5, 12, 15),
      ...this.getRowCoordinatesInRange(7, 6, 9),
      ...this.getColCoordinatesInRange(6, 8, 10),
      ...this.getColCoordinatesInRange(9, 8, 10),
      ...this.getRowCoordinatesInRange(11, 6, 9),
    ];
    this.rocksCoordinates = [
      ...this.getRowCoordinatesInRange(6, 0, 3),
      ...this.getRowCoordinatesInRange(6, 12, 15),
      ...this.getColCoordinatesInRange(5, 3, 12),
      ...this.getColCoordinatesInRange(10, 3, 12),
      ...this.getRowCoordinatesInRange(12, 0, 3),
      ...this.getRowCoordinatesInRange(12, 12, 15),
    ];
    this.FRUIT_TYPE = ['banana', 'grape', 'apple'];
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS + 500; // 1.5s slower than the other levels
    this.loadConstants();
  }

  protected async handleEnemyMovement(enemy: Enemy): Promise<void> {
    if (this.checkLose() || this.checkWin()) {
      await this.stopGame();
    }
    await enemy.calculateMovement();
    // Don't notify here, because this time is not the same as the other enemies
  }
}
