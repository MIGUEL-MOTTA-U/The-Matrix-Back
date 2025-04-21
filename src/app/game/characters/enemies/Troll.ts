import CharacterError from '../../../../errors/CharacterError.js';
import { type BoardItemDTO, validatePlayerState } from '../../../../schemas/zod.js';
import type Cell from '../../match/boards/CellBoard.js';
import type Character from '../Character.js';
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
   * Converts the Troll into a `BoardItemDTO` object.
   *
   * @return {BoardItemDTO} An object representing the Troll.
   */
  getDTO(): BoardItemDTO {
    return { type: 'troll', orientation: this.orientation, id: this.id };
  }

  /**
   * Moves the Troll to a new cell and interacts with any character present.
   *
   * @param {Cell} cellUp The new cell to move to.
   * @param {Character | null} character The character in the new cell, if any.
   * @return {Promise<null>} A promise that resolves when the move is completed.
   */
  protected async move(cellUp: Cell, character: Character | null): Promise<null> {
    this.cell.setCharacter(null);
    cellUp.setCharacter(this);
    this.cell = cellUp;
    if (character && !character.kill()) {
      const died = character.die();
      if (died) this.board.notifyPlayers(validatePlayerState(character.getCharacterState()));
    }
    return null; // The Troll doesn't consume anything.
  }

  /**
   * Validates if the Troll can move to a given cell.
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
   * Calculates the movement of the Troll.
   * The Troll attempts to keep moving in its current direction or moves randomly if it encounters an obstacle.
   *
   * @return {Promise<void>} A promise that resolves when the movement is calculated.
   */
  public async calculateMovement(): Promise<void> {
    try {
      await this.keepMoving();
    } catch (_error) {
      let flag = false;
      while (!flag) {
        try {
          await this.moveRandomDirection();
          flag = true;
        } catch (_err) {}
      }
    }
  }

  /**
   * Moves the Troll in a random direction.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the Troll moves in a random direction.
   */
  private async moveRandomDirection(): Promise<void> {
    const random = Math.floor(Math.random() * 4);
    switch (random) {
      case 0:
        await this.moveDown();
        return;
      case 1:
        await this.moveUp();
        return;
      case 2:
        await this.moveLeft();
        return;
      case 3:
        await this.moveRight();
        return;
    }
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
}
