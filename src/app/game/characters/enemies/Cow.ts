import Enemy from './Enemy.js';

/**
 * @class Cow
 * Represents the behavior and properties of a Cow enemy in the game.
 * The Cow moves towards the players and can break frozen cells.
 *
 * @since 7/05/2025
 * @extends Enemy
 * @author Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default class Cow extends Enemy {
  /**
   * Calculates the movement of the Cow.
   * The Cow moves towards the players and can break frozen cells.
   *
   * @return {Promise<void>} A promise that resolves when the movement is calculated.
   */
  public async calculateMovement(): Promise<void> {
    const canBreakFrozen = false;
    const bestPath =
      this.board.getBestDirectionToPlayers(this.cell, canBreakFrozen) || this.orientation;
    try {
      await this.moveAlongPath(bestPath);
    } catch (_error) {
      this.enemyState = 'stopped';
      // Do nothing if the Cow cannot move. It will just stay in its current position.
    }
  }
  /**
   * This method retrieves the name of the Cow enemy.
   * @returns {string} - The name of the enemy.
   */
  public getEnemyName(): string {
    return 'cow';
  }
}
