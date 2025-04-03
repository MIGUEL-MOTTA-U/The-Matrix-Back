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
  protected orientation: 'down' | 'up' | 'left' | 'right' = 'down';

  async moveUp(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBOard = await this.mutex.runExclusive(() => {
      const cellUp = this.cell.getUpCell();
      const { character, cell } = this.validateMove(cellUp);
      const idItem = this.move(cell, character);
      this.orientation = 'up';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBOard);
  }

  public changeOrientation(orientation: 'down' | 'up' | 'left' | 'right'): void {
    this.orientation = orientation;
  }

  async moveDown(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(() => {
      const cellDown = this.cell.getDownCell();
      const { character, cell } = this.validateMove(cellDown);
      const idItem = this.move(cell, character);
      this.orientation = 'down';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBoard);
  }

  async moveLeft(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(() => {
      const cellLeft = this.cell.getLeftCell();
      const { character, cell } = this.validateMove(cellLeft);
      const idItem = this.move(cell, character);
      this.orientation = 'left';
      return idItem;
    });
    return this.getCharacterUpdate(idItemBoard);
  }

  async moveRight(): Promise<PlayerMove | UpdateEnemy> {
    const idItemBoard = await this.mutex.runExclusive(() => {
      const cellRight = this.cell.getRightCell();
      const { character, cell } = this.validateMove(cellRight);
      const idItem = this.move(cell, character);
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
  protected abstract move(cell: Cell, character: Character | null): string | null;
  protected abstract validateMove(cell: Cell | null): { character: Character | null; cell: Cell };
  protected abstract getCharacterUpdate(idItemConsumed: string | null): PlayerMove | UpdateEnemy;

  // The characters can't block the cell
  public blocked(): boolean {
    return false;
  }

  public pick(): undefined {
    return undefined;
  } // The characters can't be picked up
}
export default Character;
