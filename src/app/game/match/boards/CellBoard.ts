import type { CellDTO } from '../../../../schemas/zod.js';
import type Character from '../../characters/Character.js';
import type { BoardItem } from './BoardItem.js';

/**
 * The responsability of this class is to represent
 * the behaviour and properties of a cell in the game.
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

  public getUpCell(): Cell | null {
    return this.up;
  }

  public blocked(): boolean {
    return this.item ? this.item.blocked() : false;
  }

  public getDownCell(): Cell | null {
    return this.down;
  }

  public getLeftCell(): Cell | null {
    return this.left;
  }

  public getRightCell(): Cell | null {
    return this.right;
  }

  /**
   * Method to create a new cell
   * @param x {number} The x position of the cell
   * @param y {number} The y position of the cell
   */
  constructor(x: number, y: number) {
    this.xPosition = x;
    this.yPosition = y;
  }

  public setNeighbors(
    cellUp: Cell | null,
    cellDown: Cell | null,
    cellLeft: Cell | null,
    cellRight: Cell | null
  ) {
    this.up = cellUp;
    this.down = cellDown;
    this.left = cellLeft;
    this.right = cellRight;
  }

  /**
   * This method returns the coordinates of the cell.
   * @returns {x: number, y: number} The coordinates of the cell
   */
  public getCoordinates(): { x: number; y: number } {
    return { x: this.xPosition, y: this.yPosition };
  }

  public setItem(item: BoardItem | null): void {
    this.item = item;
  }

  public getItem(): BoardItem | null {
    return this.item;
  }

  public getCharacter(): Character | null {
    return this.character;
  }

  public setCharacter(character: Character | null): void {
    this.character = character;
  }

  public async pickItem(): Promise<string | null >{
    const pickedItem = await this.item?.pick();
    return pickedItem || null;
  }

  public getCellDTO(): CellDTO | null {
    if (!this.item && !this.character) return null;
    return {
      x: this.xPosition,
      y: this.yPosition,
      item: this.item?.getDTO() || null,
      character: this.character?.getDTO() || null,
    };
  }
}
export default Cell;
