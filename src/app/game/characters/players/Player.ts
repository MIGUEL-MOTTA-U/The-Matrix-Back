import CharacterError from '../../../../errors/CharacterError.js';
import MatchError from '../../../../errors/MatchError.js';
import {
  type BoardItemDTO,
  type CellDTO,
  type PlayerMove,
  type PlayerStorage,
  type UserQueue,
  validatePlayerMove,
} from '../../../../schemas/zod.js';
import type Cell from '../../match/boards/CellBoard.js';
import Character from '../Character.js';

/**
 * @class Player
 * Represents the behavior and properties of a player in the game "Bad Ice Cream".
 * Extends the `Character` class and implements player-specific methods such as movement and state management.
 *
 * @since 18/04/2025
 * @extends Character
 * @author
 * Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
class Player extends Character {
  private status: 'WAITING' | 'PLAYING' | 'READY' = 'WAITING';
  private name = 'Anonymous';
  /**
   * Retrieves the player's update information, including position, state, and consumed items.
   *
   * @param {string | null} idItem The ID of the item consumed by the player, or null if none.
   * @return {PlayerMove} The player's updated state and position.
   */
  public getCharacterUpdate(idItem: string | null): PlayerMove {
    const idItemConsumed = idItem ? idItem : undefined;
    const numberOfFruits = idItemConsumed ? this.board.getFruitsNumber() : undefined;
    return validatePlayerMove({
      id: this.id,
      coordinates: this.getCoordinates(),
      direction: this.orientation,
      state: this.getState(),
      idItemConsumed,
      numberOfFruits,
    });
  }

  public updatePlayer(data: Partial<UserQueue>): void {
    if (data.color) this.color = data.color;
    if (data.status) this.status = data.status;
    if (data.name) this.name = data.name;
  }

  public getPlayerStorage(): PlayerStorage {
    return {
      id: this.id,
      color: this.color,
      coordinates: this.getCoordinates(),
      direction: this.orientation,
      state: this.getState(),
    };
  }

  /**
   * Converts the player into a `BoardItemDTO` object.
   *
   * @return {BoardItemDTO} An object representing the player.
   */
  getDTO(): BoardItemDTO {
    return { type: 'player', id: this.id, orientation: this.orientation };
  }

  /**
   * Executes the player's special power.
   *
   * @returns {Promise<CellDTO[]>} A promise that resolves to an array of `CellDTO` objects representing the frozen cells.
   *
   */
  public async execPower(): Promise<CellDTO[]> {
    return await this.mutex.runExclusive(() => {
      return this.cell.executePower(this.orientation, true);
    });
  }

  /**
   * Indicates whether the player can kill other characters.
   *
   * @return {boolean} False, as players cannot kill.
   */
  kill(): boolean {
    return false;
  }

  /**
   * Executes the logic when the player dies, marking them as not alive.
   *
   * @return {boolean} True, indicating the player has died.
   */
  die(): boolean {
    this.alive = false;
    return true;
  }

  /**
   * Restarts the player. (Not implemented yet)
   *
   * @throws {Error} This method is not implemented.
   */
  reborn(): void {
    this.alive = true;
  }

  /**
   * Retrieves the ID of the player.
   *
   * @return {string} The ID of the player.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Checks if the player is alive.
   *
   * @return {boolean} True if the player is alive, false otherwise.
   */
  public isAlive(): boolean {
    return this.alive;
  }

  /**
   * Retrieves the coordinates of the player's current position.
   *
   * @return {{ x: number; y: number }} The coordinates of the player's position.
   */
  public getCoordinates(): { x: number; y: number } {
    return this.cell.getCoordinates();
  }

  /**
   * Moves the player to a new cell and handles interactions with items or characters.
   *
   * @param {Cell} cellnew The new cell to move to.
   * @param {Character | null} character The character in the new cell, if any.
   * @return {Promise<string | null>} A promise that resolves to the ID of the item picked up, or null if none.
   * @throws {MatchError} If the game is already won.
   */
  protected async move(cellnew: Cell, character: Character | null): Promise<string | null> {
    if (this.board.checkWin()) throw new MatchError(MatchError.WIN);
    this.cell.setCharacter(null);
    cellnew.setCharacter(this);
    this.cell = cellnew;
    const idItem = this.cell.pickItem();

    if (character?.kill()) {
      // If it's an enemy, the player dies.
      this.die();
    }
    return idItem;
  }

  /**
   * Validates if the player can move to a given cell.
   *
   * @param {Cell | null} cell The cell to validate.
   * @return {{ character: Character | null; cell: Cell }} An object containing the character in the cell (if any) and the cell itself.
   * @throws {CharacterError} If the cell is null, blocked, or contains an unkillable character.
   */
  protected validateMove(cell: Cell | null): { character: Character | null; cell: Cell } {
    if (!cell) throw new CharacterError(CharacterError.NULL_CELL); // If it's a border, it can't move
    if (cell.blocked() || cell.isFrozen()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's a block object, it can't move
    const character = cell.getCharacter();
    if (character && !character.kill()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's another player, it can't move
    return { character, cell };
  }
}
export default Player;
