import { Mutex } from 'async-mutex';
import {
  type CellCoordinates,
  type Direction,
  type PathResult,
  type PathResultWithDirection,
  type PlayerMove,
  type PlayerState,
  type UpdateEnemy,
  validatePathResultWithDirection,
} from '../../../schemas/zod.js';
import type { Graph } from '../../../utils/Graph.js';
import { BoardItem } from '../match/boards/BoardItem.js';
import type Cell from '../match/boards/CellBoard.js';

/**
 * @abstract class Character
 * This abstract class represents the behaviour and the properties
 * of a character in the game of bad-ice-cream. (Player or Enemy)
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
abstract class Character extends BoardItem {
  protected readonly mutex = new Mutex();
  protected alive = true;
  protected color: string | null = null;
  protected orientation: Direction = 'down';
  /**
   * Sets the color of the character.
   *
   * @param {string} color - The color to set for the character.
   */
  public setColor(color: string): void {
    this.color = color;
  }

  /**
   * Returns the shortest path to the target cell with the given mapped graph of the board.
   *
   * @param {Cell} targetCell - The target cell to reach.
   * @param {Graph} mappedGraph - The graph representing the board.
   * @return {Direction} The direction to move towards the target cell.
   */
  public getShortestPath(
    targetCell: Cell,
    mappedGraph: Graph<CellCoordinates>
  ): PathResultWithDirection | null {
    const shortestPath: PathResult = mappedGraph.shortestPathDijkstra(
      this.cell.getCoordinates(),
      targetCell.getCoordinates()
    );
    if (shortestPath.distance > 0) {
      const direction: Direction | null = this.cell.getDirection(shortestPath.path[0]);
      return validatePathResultWithDirection({
        distance: shortestPath.distance,
        path: shortestPath.path,
        direction,
      });
    }
    return null;
  }

  /**
   * Retrieves the current state of the character.
   *
   * @return {'alive' | 'dead'} The state of the character, either "alive" or "dead".
   */
  public getState(): 'alive' | 'dead' {
    return this.alive ? 'alive' : 'dead';
  }

  /**
   * Retrieves the current state of the character including its ID, state, and color.
   *
   * @return {PlayerState} The state of the character.
   */
  public getCharacterState(): PlayerState {
    const color = this.color ? this.color : undefined;
    return {
      id: this.id,
      state: this.getState(),
      color,
    };
  }

  /**
   * Moves the character up in the game board.
   *
   * @return {Promise<PlayerMove | UpdateEnemy>} A promise resolving to the updated state of the character.
   */
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

  /**
   * Changes the orientation of the character.
   *
   * @param {'down' | 'up' | 'left' | 'right'} orientation - The new orientation of the character.
   * @return {PlayerMove | UpdateEnemy} The updated state of the character.
   */
  public changeOrientation(orientation: Direction): PlayerMove | UpdateEnemy {
    this.orientation = orientation;
    return this.getCharacterUpdate(null);
  }

  /**
   * Moves the character down in the game board.
   *
   * @return {Promise<PlayerMove | UpdateEnemy>} A promise resolving to the updated state of the character.
   */
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

  /**
   * Moves the character left in the game board.
   *
   * @return {Promise<PlayerMove | UpdateEnemy>} A promise resolving to the updated state of the character.
   */
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

  /**
   * Moves the character right in the game board.
   *
   * @return {Promise<PlayerMove | UpdateEnemy>} A promise resolving to the updated state of the character.
   */
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

  /**
   * Retrieves the current orientation of the character.
   *
   * @return {Direction} The current orientation of the character.
   */
  public getOrientation(): Direction {
    return this.orientation;
  }

  abstract execPower(): void;
  abstract die(): boolean;
  abstract kill(): boolean;
  abstract reborn(): void;
  protected abstract move(cell: Cell, character: Character | null): Promise<string | null>;
  protected abstract validateMove(cell: Cell | null): { character: Character | null; cell: Cell };
  public abstract getCharacterUpdate(idItemConsumed: string | null): PlayerMove | UpdateEnemy;

  /**
   * Determines if the character blocks the cell.
   *
   * @return {boolean} Always returns false, as characters cannot block cells.
   */
  public blocked(): boolean {
    return false;
  }

  /**
   * Picks up the character. This method is not implemented for characters.
   *
   * @return {Promise<undefined>} Always resolves to undefined.
   */
  public async pick(): Promise<undefined> {
    return undefined;
  }
}
export default Character;
