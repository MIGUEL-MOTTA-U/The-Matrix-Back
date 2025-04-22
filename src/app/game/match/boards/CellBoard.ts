import type { CellDTO } from '../../../../schemas/zod.js';
import type Character from '../../characters/Character.js';
import type { BoardItem } from './BoardItem.js';

/**
 * @class Cell
 * The responsability of this class is to represent
 * the behaviour and properties of a cell in the game.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
class Cell {
  private xPosition: number;
  private yPosition: number;
  private item: BoardItem | null = null;
  private up: Cell | null = null;
  private down: Cell | null = null;
  private character: Character | null = null;
  private left: Cell | null = null;
  private right: Cell | null = null;

  /**
   * Returns the cell above the current cell.
   *
   * @return {Cell | null} The cell above the current cell, or null if it doesn't exist.
   */
  public getUpCell(): Cell | null {
    return this.up;
  }

  /**
   * Checks if the cell is blocked by an item.
   *
   * @return {boolean} True if the cell is blocked, false otherwise.
   */
  public blocked(): boolean {
    return this.item ? this.item.blocked() : false;
  }

  /**
   * Returns the cell below the current cell.
   *
   * @return {Cell | null} The cell below the current cell, or null if it doesn't exist.
   */
  public getDownCell(): Cell | null {
    return this.down;
  }

  /**
   * Returns the cell to the left of the current cell.
   *
   * @return {Cell | null} The cell to the left of the current cell, or null if it doesn't exist.
   */
  public getLeftCell(): Cell | null {
    return this.left;
  }

  /**
   * Returns the cell to the right of the current cell.
   *
   * @return {Cell | null} The cell to the right of the current cell, or null if it doesn't exist.
   */
  public getRightCell(): Cell | null {
    return this.right;
  }

  /**
   * Creates a new cell with the specified coordinates.
   *
   * @param {number} x The x-coordinate of the cell.
   * @param {number} y The y-coordinate of the cell.
   */
  constructor(x: number, y: number) {
    this.xPosition = x;
    this.yPosition = y;
  }

  /**
   * Sets the neighboring cells for the current cell.
   *
   * @param {Cell | null} cellUp The cell above the current cell.
   * @param {Cell | null} cellDown The cell below the current cell.
   * @param {Cell | null} cellLeft The cell to the left of the current cell.
   * @param {Cell | null} cellRight The cell to the right of the current cell.
   */
  public setNeighbors(
    cellUp: Cell | null,
    cellDown: Cell | null,
    cellLeft: Cell | null,
    cellRight: Cell | null
  ): void {
    this.up = cellUp;
    this.down = cellDown;
    this.left = cellLeft;
    this.right = cellRight;
  }

  /**
   * Returns the coordinates of the cell.
   *
   * @return {{ x: number; y: number }} The coordinates of the cell.
   */
  public getCoordinates(): { x: number; y: number } {
    return { x: this.xPosition, y: this.yPosition };
  }

  /**
   * Sets the given item in the cell.
   *
   * @param {BoardItem | null} item The item to be set in the cell.
   * @return {void}
   */
  public setItem(item: BoardItem | null): void {
    this.item = item;
  }

  /**
   * Returns the item in the cell.
   *
   * @return {BoardItem | null} The item in the cell, or null if none exists.
   */
  public getItem(): BoardItem | null {
    return this.item;
  }

  /**
   * Returns the character in the cell.
   *
   * @return {Character | null} The character in the cell, or null if none exists.
   */
  public getCharacter(): Character | null {
    return this.character;
  }

  /**
   * Sets the given character in the cell.
   *
   * @param {Character | null} character The character to be set in the cell.
   * @return {void}
   */
  public setCharacter(character: Character | null): void {
    this.character = character;
  }

  /**
   * Picks the item in the cell.
   *
   * @return {Promise<string | null>} A promise that resolves to the picked item, or null if none exists.
   */
  public async pickItem(): Promise<string | null> {
    const pickedItem = await this.item?.pick();
    return pickedItem || null;
  }

  /**
   * Converts the cell into a CellDTO object.
   *
   * @return {CellDTO | null} A CellDTO object representing the cell, or null if the cell is empty.
   */
  public getCellDTO(): CellDTO | null {
    if (!this.item && !this.character) return null;
    return {
      coordinates: this.getCoordinates(),
      item: this.item?.getDTO() || null,
      character: this.character?.getDTO() || null,
    };
  }
}
export default Cell;
