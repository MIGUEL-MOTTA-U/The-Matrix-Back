import type Enemy from '../../../characters/enemies/Enemy.js';
import Board from '../Board.js';
import type Cell from '../CellBoard.js';

export default class Level5Board extends Board {
  protected getBoardEnemy(_cell: Cell): Enemy {
    throw new Error('Method not implemented.');
  }
  protected setUpEnemies(): void {
    throw new Error('Method not implemented.');
  }

  protected setUpInmovableObjects(): void {
    throw new Error('Method not implemented.');
  }

  protected loadContext(): void {
    throw new Error('Method not implemented.');
  }

  protected startEnemies(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
