import BoardError from '../../../../errors/BoardError.js';
import type { CellCoordinates, CellDTO, Direction } from '../../../../schemas/zod.js';
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
  private frozen = false;

  /**
   * Returns if the cell is frozen.
   *
   * @returns {boolean} True if the cell is frozen, false otherwise.
   */
  public isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * This method is used to freeze or unfreeze by a player order.
   *
   * @param {Direction} direction The direction to freeze or unfreeze the cell.
   * @returns {CellDTO[]} An array of CellDTO objects representing the frozen cells.
   */
  public executePower(direction: Direction, recursiveBehaviour: boolean): CellDTO[] {
    const cells: CellDTO[] = [];
    const nextCell = this.cellFromDirection(direction);
    if (!nextCell || nextCell.blocked()) return cells;
    if (nextCell.isFrozen()) return nextCell.unfreeze(cells, direction, recursiveBehaviour);
    return nextCell.freeze(cells, direction, recursiveBehaviour);
  }

  /**
   * This method is used to unfreeze the cells around the current cell.
   * @returns {CellDTO[]} An array of CellDTO objects representing the unfrozen cells.
   */
  public unfreezeCellsAround(): CellDTO[] {
    const cells: CellDTO[] = [];
    for (const neighbor of this.getNeighbors()) {
      const direction = this.getDirection(neighbor.getCoordinates());
      if (direction) neighbor.unfreeze(cells, direction, false);
    }
    return cells;
  }

  /**
   * This method is used to freeze or unfreeze the cell.
   *
   * @param {boolean} frozen True to freeze the cell, false to unfreeze it.
   */
  public setFrozen(frozen: boolean): void {
    this.frozen = frozen;
  }

  /**
   * This method is used to unfreeze the cells in the given direction.
   * @param direction The direction to unfreeze the cells.
   * @param keepUnfreezing True to keep unfreezing cells in the given direction until it can't unfreeze any more.
   * @returns {CellDTO[]} An array of CellDTO objects representing the unfrozen cells.
   */
  public unfreezeFrontCells(direction: Direction, keepUnfreezing: boolean): CellDTO[] {
    return this.unfreeze([], direction, keepUnfreezing);
  }

  /**
   * This method returns the cell in the given direction.
   * @param direction The direction to freeze the cells.
   * @returns {Cell | null} The cell in the given direction, or null if it doesn't exist.
   */
  public cellFromDirection(direction: Direction): Cell | null {
    switch (direction) {
      case 'up':
        return this.up;
      case 'down':
        return this.down;
      case 'left':
        return this.left;
      case 'right':
        return this.right;
      default:
        throw new BoardError(BoardError.FREEZE_DIRECTION_ERROR);
    }
  }

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
   * Returns the neighboring cells of the current cell.
   *
   * @returns {Cell[]} An array of neighboring cells.
   */
  public getNeighbors(): Cell[] {
    const neighbors: Cell[] = [];
    if (this.up) neighbors.push(this.up);
    if (this.down) neighbors.push(this.down);
    if (this.left) neighbors.push(this.left);
    if (this.right) neighbors.push(this.right);
    return neighbors;
  }

  /**
   * Returns the direction of the given cell relative to the current cell.
   *
   * @param {CellCoordinates} cell The cell to compare with.
   * @return {Direction | null } The direction of the given cell relative to the current cell.
   */
  public getDirection(cell: CellCoordinates): Direction | null {
    if (cell.x === this.xPosition && cell.y === this.yPosition) return null;
    if (cell.x === this.xPosition && cell.y < this.yPosition) return 'left';
    if (cell.x === this.xPosition && cell.y > this.yPosition) return 'right';
    if (cell.x < this.xPosition && cell.y === this.yPosition) return 'up';
    if (cell.x > this.xPosition && cell.y === this.yPosition) return 'down';
    return null;
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
    if (!this.item && !this.character && !this.frozen) return null;
    return {
      coordinates: this.getCoordinates(),
      item: this.item?.getDTO() || null,
      character: this.character?.getDTO() || null,
      frozen: this.frozen,
    };
  }

  private unfreeze(cells: CellDTO[], direction: Direction, keepUnfreezing: boolean): CellDTO[] {
    if (!this.frozen) return cells;
    const cellDTO = this.getCellDTO();
    this.setFrozen(false);
    
    if (cellDTO){
      cellDTO.frozen = false;
      cells.push(cellDTO);
    }
    const nextCell = this.cellFromDirection(direction);
    if (nextCell && keepUnfreezing) nextCell.unfreeze(cells, direction, keepUnfreezing);
    return cells;
  }

  private freeze(cells: CellDTO[], direction: Direction, keepFreezing: boolean): CellDTO[] {
    if (this.frozen || this.blocked() || this.getCharacter() !== null) return cells;
    this.setFrozen(true);
    const cellDTO = this.getCellDTO();
    if (cellDTO) cells.push(cellDTO);

    const nextCell = this.cellFromDirection(direction);

    if (nextCell && keepFreezing) nextCell.freeze(cells, direction, keepFreezing);
    return cells;
  }
}
export default Cell;
