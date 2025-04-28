import { type PlayerMove, type UpdateEnemy, validateUpdateEnemy } from '../../../../schemas/zod.js';
import Character from '../Character.js';

/**
 * @class Enemy
 * Represents the base behavior and properties of an enemy in the game.
 * This abstract class defines the common functionality for all enemy types, such as movement and interactions with players.
 *
 * @since 18/04/2025
 * @extends Character
 * @abstract
 * @author
 * Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default abstract class Enemy extends Character {
  /**
   * Calculates the movement of the enemy.
   * This method must be implemented by subclasses to define specific movement behavior.
   *
   * @abstract
   * @return {Promise<void>} A promise that resolves when the movement is calculated.
   */
  public abstract calculateMovement(): Promise<void>;

  /**
   * Executes the enemy's special power.
   * Enemies do not have special powers, so this method does nothing.
   */
  execPower(): void {
    // Enemy has no power
  }

  /**
   * Retrieves the ID of the enemy.
   *
   * @return {string} The ID of the enemy.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Retrieves the update information for the enemy, including its position and orientation.
   *
   * @param {string | null} _idItemConsumed The ID of the item consumed (not applicable for enemies).
   * @return {UpdateEnemy} An object containing the enemy's updated state.
   */
  public getCharacterUpdate(_idItemConsumed: string | null): UpdateEnemy {
    return validateUpdateEnemy({
      enemyId: this.id,
      coordinates: this.cell.getCoordinates(),
      direction: this.orientation,
    });
  }

  /**
   * Indicates whether the enemy can kill other characters.
   *
   * @return {boolean} True, as enemies can kill players.
   */
  kill(): boolean {
    return true;
  }

  /**
   * Executes the logic when the enemy "dies".
   * Enemies cannot die, so this method always returns false.
   *
   * @return {boolean} False, as enemies cannot die.
   */
  die(): boolean {
    return false;
  }

  /**
   * Restarts the enemy.
   * Enemies cannot be reborn because they cannot die.
   */
  reborn(): void {
    // Enemy cannot reborn, because it can't die either
  }
}
