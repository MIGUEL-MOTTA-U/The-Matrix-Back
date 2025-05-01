import Enemy from './Enemy.js';

export default class Cow extends Enemy {
  public async calculateMovement(): Promise<void> {
    const bestPath = this.board.getBestPathPlayers(this.cell) || this.orientation;
    try {
      await this.moveAlongPath(bestPath);
    } catch (_error) {
      // Do nothing if the Cow cannot move. It will just stay in its current position.
    }
  }
}
