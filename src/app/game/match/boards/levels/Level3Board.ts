import Board from '../Board.js';

export default class Level3Board extends Board {
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
