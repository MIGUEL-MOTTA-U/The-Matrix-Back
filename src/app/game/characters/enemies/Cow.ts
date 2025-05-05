import Enemy from './Enemy.js';

export default class Cow extends Enemy {
  public async calculateMovement(): Promise<void> {
    const canBreakFrozen = false;
    const bestPath =
      this.board.getBestDirectionToPlayers(this.cell, canBreakFrozen) || this.orientation;
    try {
      await this.moveAlongPath(bestPath);
    } catch (_error) {
      // Do nothing if the Cow cannot move. It will just stay in its current position.
    }
  }
}
