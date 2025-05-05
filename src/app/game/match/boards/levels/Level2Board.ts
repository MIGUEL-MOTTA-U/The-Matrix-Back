import { config } from '../../../../../server.js';
import Cow from '../../../characters/enemies/Cow.js';
import type Enemy from '../../../characters/enemies/Enemy.js';
import type Match from '../../Match.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';
import Rock from '../Rock.js';

export default class Level2Board extends Board {
  constructor(match: Match, map: string, level: number) {
    super(match, map, level);
    this.loadContext(); // We exec this method twice, because of TypeScript, it doesn't saves the status assigned after we use the father constructor:)
  }

  protected getBoardEnemy(cell: Cell): Enemy {
    return new Cow(cell, this);
  }

  protected setUpInmovableObjects(): void {
    for (let i = 0; i < this.ROCKS; i++) {
      const x = this.rocksCoordinates[i][0];
      const y = this.rocksCoordinates[i][1];
      if (this.board[x][y].getCharacter() === null) {
        const rock = new Rock(this.board[x][y], this);
        this.board[x][y].setItem(rock);
      }
    }
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

      ...Array.from({ length: 4 }, (_, i) => i + 6).flatMap((row) =>
        this.getRowCoordinatesInRange(row, 6, 9)
      ),

      ...this.getRowCoordinatesInRange(10, 1, 4),
      ...this.getRowCoordinatesInRange(10, 11, 14),
    ];
    this.ROCKS = this.rocksCoordinates.length;
    this.FRUITS = this.fruitsCoordinates.length;
    this.FRUIT_TYPE = ['banana', 'grape'];
    this.FRUITS_CONTAINER = [...this.FRUIT_TYPE];
    this.ENEMIES = this.enemiesCoordinates.length;
    this.fruitsRounds = this.FRUIT_TYPE.length;
    this.ENEMIES_SPEED = config.ENEMIES_SPEED_MS;
  }
}
