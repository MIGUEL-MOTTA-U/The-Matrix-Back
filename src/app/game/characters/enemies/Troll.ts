import CharacterError from '../../../../errors/CharacterError.js';
import type { BoardItemDTO } from '../../../../schemas/zod.js';
import type Cell from '../../match/boards/CellBoard.js';
import type Character from '../Character.js';
import Enemy from './Enemy.js';

export default class Troll extends Enemy {
  getDTO(): BoardItemDTO {
    return { type: 'troll', orientation: this.orientation, id: this.id };
  }
  protected async move(cellUp: Cell, character: Character | null): Promise<null> {
    this.cell.setCharacter(null);
    cellUp.setCharacter(this);
    this.cell = cellUp;
    if (character && !character.kill()) {
      character.die(); // If it's a player, it dies.
    }
    return null; // The troll doesn't consume anything
  }

  protected validateMove(cell: Cell | null): { character: Character | null; cell: Cell } {
    if (!cell) throw new CharacterError(CharacterError.NULL_CELL); // If it's a border it can't move
    if (cell.blocked()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's a block object, it can't move
    const character = cell.getCharacter();
    if (character?.kill()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's other enemy, it can't move
    return { character, cell };
  }

  async calculateMovement(): Promise<void> {
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

  private async moveRandomDirection(): Promise<void> {
    const random = Math.floor(Math.random() * 4);
    switch (random) {
      case 0:
        await this.moveDown();
        break;
      case 1:
        await this.moveUp();
        break;
      case 2:
        await this.moveLeft();
        break;
      case 3:
        await this.moveRight();
        break;
    }
  }

  private async keepMoving(): Promise<void> {
    switch (this.orientation) {
      case 'down':
        await this.moveDown();
        break;
      case 'up':
        await this.moveUp();
        break;
      case 'left':
        await this.moveLeft();
        break;
      case 'right':
        await this.moveRight();
        break;
    }
  }
}
