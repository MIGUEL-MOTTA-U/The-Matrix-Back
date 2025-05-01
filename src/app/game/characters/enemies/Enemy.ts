import CharacterError from '../../../../errors/CharacterError.js';
import {
  type BoardItemDTO,
  type Direction,
  type UpdateEnemy,
  validatePlayerState,
  validateUpdateEnemy,
} from '../../../../schemas/zod.js';
import type Cell from '../../match/boards/CellBoard.js';
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
   * Validates if the Enemy can move to a given cell.
   *
   * @param {Cell | null} cell The cell to validate.
   * @return {{ character: Character | null; cell: Cell }} An object containing the character in the cell (if any) and the cell itself.
   * @throws {CharacterError} If the cell is null, blocked, or contains an unkillable character.
   */
  protected validateMove(cell: Cell | null): { character: Character | null; cell: Cell } {
    if (!cell) throw new CharacterError(CharacterError.NULL_CELL); // If it's a border, it can't move.
    if (cell.blocked()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's a block object, it can't move.
    const character = cell.getCharacter();
    if (character?.kill()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's another enemy, it can't move.
    return { character, cell };
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
   * Moves the Enemy to a new cell and interacts with any character present.
   *
   * @param {Cell} cellUp The new cell to move to.
   * @param {Character | null} character The character in the new cell, if any.
   * @return {Promise<null>} A promise that resolves when the move is completed.
   */
  protected async move(cellUp: Cell, character: Character | null): Promise<null | string> {
    this.cell.setCharacter(null);
    cellUp.setCharacter(this);
    this.cell = cellUp;
    if (character && !character.kill()) {
      const died = character.die();
      if (died)
        this.board.notifyPlayers({
          type: 'update-state',
          payload: validatePlayerState(character.getCharacterState()),
        });
    }
    return null;
  }

  /**
   * Moves the Enemy in a specified direction.
   *
   * @param {string} path The direction to move in ('up', 'down', 'left', 'right').
   * @returns {Promise<void>} A promise that resolves when the Enemy moves in the specified direction.
   */
  protected async moveAlongPath(path: Direction): Promise<void> {
    switch (path) {
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
   * Executes the logic when the enemy "dies".
   * Enemies cannot die, so this method always returns false.
   *
   * @return {boolean} False, as enemies cannot die.
   */
  die(): boolean {
    return false;
  }
  /**
   * Converts the Troll into a `BoardItemDTO` object.
   *
   * @return {BoardItemDTO} An object representing the Troll.
   */
  getDTO(): BoardItemDTO {
    return {
      type: this.constructor.name.toLowerCase(),
      orientation: this.orientation,
      id: this.id,
    };
  }

  /**
   * Restarts the enemy.
   * Enemies cannot be reborn because they cannot die.
   */
  reborn(): void {
    // Enemy cannot reborn, because it can't die either
  }
}
