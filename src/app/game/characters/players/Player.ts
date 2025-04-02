import CharacterError from '../../../../errors/CharacterError.js';
import MatchError from '../../../../errors/MatchError.js';
import type { BoardItemDTO } from '../../../../schemas/zod.js';
import type Cell from '../../match/boards/CellBoard.js';
import Character from '../Character.js';

/**
 * This class represents the behaviour and the properties
 * of a player in the game of bad-ice-cream.
 */
class Player extends Character {
  getDTO(): BoardItemDTO {
    return { type: 'player', id: this.id, orientation: this.orientation };
  }

  /**
   * This method executes the player power
   */
  execPower(): void {
    // TODO --> Implement power
    throw new Error('Method not implemented.');
  }

  /**
   * This method returns true if the player can kill
   * @returns {boolean} False, the player cannot kill
   */
  kill(): boolean {
    return false;
  }

  /**
   * This method is executed when a player dies and stops the game for that player
   */
  die(): void {
    this.alive = false;
  }

  /**
   * This method restartds the player // TODO
   */
  reborn(): void {
    throw new Error('Method not implemented.');
  }

  /**
   * This method returns the id of the player
   * @returns {string} The id of the player
   */
  public getId(): string {
    return this.id;
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public getCoordinates(): { x: number; y: number } {
    return this.cell.getCoordinates();
  }

  protected move(cellnew: Cell, character: Character | null): void {
    if (this.checkWin()) throw new MatchError(MatchError.WIN);
    this.cell.setCharacter(null);
    cellnew.setCharacter(this);
    this.cell = cellnew;
    this.cell.pickItem();

    if (character?.kill()) {
      // If it's an enemy, it dies.
      this.die();
    }
  }

  private checkWin(): boolean {
    return this.board.checkWin();
  }

  protected validateMove(cell: Cell | null): { character: Character | null; cell: Cell } {
    if (!cell) throw new CharacterError(CharacterError.NULL_CELL); // If it's a border it can't move
    if (cell.blocked()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's a block object, it can't move
    const character = cell.getCharacter();
    if (character && !character.kill()) throw new CharacterError(CharacterError.BLOCKED_CELL); // If it's other player, it can't move
    return { character, cell };
  }
}
export default Player;
