import type { Direction } from '../../../../schemas/zod.js';
import Enemy from './Enemy.js';

/**
 * @class Troll
 * Represents the behavior and properties of a Troll enemy in the game.
 * The Troll moves randomly or in a specific direction and interacts with other characters on the board.
 *
 * @since 18/04/2025
 * @extends Enemy
 * @author
 * Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default class Troll extends Enemy {
  /**
   * Calculates the movement of the Troll.
   * The Troll attempts to keep moving in its current direction or moves randomly if it encounters an obstacle.
   *
   * @return {Promise<void>} A promise that resolves when the movement is calculated.
   */
  public async calculateMovement(): Promise<void> {
    const movements: Direction[] = ['up', 'down', 'left', 'right'];
    try {
      await this.keepMoving();
    } catch (_error) {
      while (movements.length > 0) {
        try {
          await this.moveRandomDirection(movements);
          return;
        } catch (_err) {
          this.enemyState = 'stopped';
        }
      }
    }
  }

  /**
   * Moves the Troll in a random direction.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the Troll moves in a random direction.
   */
  private async moveRandomDirection(movements: Direction[]): Promise<void> {
    const random = Math.floor(Math.random() * movements.length);
    const direction = movements[random];
    movements.splice(random, 1);
    await this.moveAlongPath(direction);
  }

  /**
   * Keeps the Troll moving in its current orientation.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the Troll continues moving in its current direction.
   */
  private async keepMoving(): Promise<void> {
    switch (this.orientation) {
      case 'down':
        await this.moveDown();
        return;
      case 'up':
        await this.moveUp();
        return;
      case 'left':
        await this.moveLeft();
        return;
      case 'right':
        await this.moveRight();
        return;
    }
  }

  /**
   * This method retrieves the name of the Troll enemy.
   * @returns {string} - The name of the enemy.
   */
  public getEnemyName(): string {
    return 'troll';
  }
}
