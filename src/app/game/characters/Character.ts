import { Mutex } from 'async-mutex';
import type { PlayerMove, UpdateEnemy } from '../../../schemas/zod.js';
import { BoardItem } from '../match/boards/BoardItem.js';
import type Cell from '../match/boards/CellBoard.js';

/**
 * This class represents the behaviour and the properties
 * of a character in the game of bad-ice-cream. (Player or Enemy)
 */
abstract class Character extends BoardItem {
  protected readonly mutex = new Mutex();
  protected alive = true;
  protected color: string | null = null;
  protected orientation: 'down' | 'up' | 'left' | 'right' = 'down';
  public setColor(color: string): void {
    this.color = color;
  }
  async moveUp(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBOard = await this.mutex.runExclusive(async () => {
      const cellUp = this.cell.getUpCell();
      const { character, cell } = this.validateMove(cellUp);
      const idItem = await this.move(cell, character);
      this.orientation = 'up';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBOard);
  }

  public changeOrientation(
    orientation: 'down' | 'up' | 'left' | 'right'
  ): PlayerMove | UpdateEnemy {
    this.orientation = orientation;
    return this.getCharacterUpdate(null);
  }

  async moveDown(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(async () => {
      const cellDown = this.cell.getDownCell();
      const { character, cell } = this.validateMove(cellDown);
      const idItem = await this.move(cell, character);
      this.orientation = 'down';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBoard);
  }

  async moveLeft(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(async () => {
      const cellLeft = this.cell.getLeftCell();
      const { character, cell } = this.validateMove(cellLeft);
      const idItem = await this.move(cell, character);
      this.orientation = 'left';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBoard);
  }

  async moveRight(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(async () => {
      const cellRight = this.cell.getRightCell();
      const { character, cell } = this.validateMove(cellRight);
      const idItem = await this.move(cell, character);
      this.orientation = 'right';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBoard);
  }

  public getOrientation(): 'down' | 'up' | 'left' | 'right' {
    return this.orientation;
  }

  abstract execPower(): void;
  abstract die(): void;
  abstract kill(): boolean;
  abstract reborn(): void;
  protected abstract move(cell: Cell, character: Character | null): Promise<string | null>;
  protected abstract validateMove(cell: Cell | null): { character: Character | null; cell: Cell };
  protected abstract getCharacterUpdate(idItemConsumed: string | null): PlayerMove | UpdateEnemy;

  // The characters can't block the cell
  public blocked(): boolean {
    return false;
  }

  public async pick(): Promise<undefined> {
    return undefined;
  } // The characters can't be picked up
}
export default Character;
