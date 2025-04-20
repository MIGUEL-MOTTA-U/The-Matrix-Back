import type { Worker } from 'node:worker_threads';
import { Mutex } from 'async-mutex';
import {
  type BoardDTO,
  type CellDTO,
  type UpdateFruits,
  validateUpdateFruits,
} from '../../../../schemas/zod.js';
import type { CellCoordinates } from '../../../../schemas/zod.js';
import type Enemy from '../../characters/enemies/Enemy.js';
import type Player from '../../characters/players/Player.js';
import type Match from '../Match.js';
import type Cell from './CellBoard.js';
import type Fruit from './Fruit.js';
/**
 * @abstract class Board
 * Abstract class representing a game board.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
abstract class Board {
  protected FRUIT_TYPE: string[] = [];
  protected FRUITS_CONTAINER: string[] = [];
  protected readonly mutex = new Mutex();
  protected readonly ROWS: number;
  protected readonly COLS: number;
  protected readonly map: string;
  protected readonly level: number;
  protected readonly match: Match;
  protected host: Player | null = null;
  protected guest: Player | null = null;
  protected board: Cell[][];
  protected enemies: Map<string, Enemy>;
  protected fruits: Map<CellCoordinates, Fruit>;
  protected fruitsNumber = 0;
  protected fruitsRounds = 0;
  protected currentRound = 0;
  protected workers: Worker[] = [];
  protected currentFruitType: string | undefined;

  protected abstract generateBoard(): void;
  protected abstract setUpEnemies(): void;
  protected abstract setUpFruits(): Promise<void>;
  protected abstract setUpPlayers(host: string, guest: string): void;
  protected abstract setUpInmovableObjects(): void;
  protected abstract loadContext(): void;
  protected abstract startEnemies(): Promise<void>;
  abstract getBoardDTO(): BoardDTO;

  constructor(match: Match, map: string, level: number) {
    this.match = match;
    this.ROWS = 16;
    this.COLS = 16;
    this.board = [];
    this.enemies = new Map();
    this.fruits = new Map();
    this.map = map;
    this.level = level;
    this.loadContext();
    this.generateBoard();
    this.setUpEnemies();
    this.setUpInmovableObjects();
  }
  /**
   * Sets up the fruits on the board after it is generated.
   *
   * @return {Promise<void>} A promise that resolves when the fruits are set up.
   */
  public async initialize(): Promise<void> {
    await this.setUpFruits();
  }

  /**
   * Removes a fruit from the board at the specified coordinates.
   *
   * @param {CellCoordinates} coordinates The coordinates of the fruit to be removed.
   * @return {Promise<void>} A promise that resolves when the fruit is removed.
   */
  public async removeFruit({ x, y }: CellCoordinates): Promise<void> {
    await this.mutex.runExclusive(async () => {
      this.board[x][y].setItem(null);
      this.fruitsNumber--;
      this.fruits.delete({ x, y });
      if (this.fruitsNumber === 0 && this.FRUIT_TYPE.length > 0) {
        await this.setUpFruits();
        await this.match.notifyPlayers(this.getUpdateFruits());
      }
      return;
    });
  }

  /**
   * Retrieves the updated information about the fruits on the board.
   *
   * @return {UpdateFruits} An object containing the updated fruit information.
   */
  protected getUpdateFruits(): UpdateFruits {
    const nextFruitType = this.FRUIT_TYPE[0] ? this.FRUIT_TYPE[0] : null;
    return validateUpdateFruits({
      fruitType: this.currentFruitType,
      fruitsNumber: this.fruitsNumber,
      cells: this.cellsBoardDTO().filter((cell: CellDTO) => cell.item !== null),
      currentRound: this.currentRound,
      nextFruitType: nextFruitType,
    });
  }

  /**
   * Returns the matrix of cells representing the board.
   *
   * @return {Cell[][]} The matrix of cells of the board.
   */
  public getBoard(): Cell[][] {
    return this.board;
  }

  /**
   * Retrieves the types of fruits available on the board.
   *
   * @return {string[]} An array of fruit types.
   */
  public getFruitTypes(): string[] {
    return this.FRUITS_CONTAINER;
  }

  /**
   * Converts the board's cells into an array of CellDTO objects.
   *
   * @return {CellDTO[]} An array of CellDTO objects representing the board's cells.
   */
  public cellsBoardDTO(): CellDTO[] {
    return this.board.flatMap(
      (row) =>
        row
          .map((cell) => cell.getCellDTO())
          .filter((cellDTO): cellDTO is CellDTO => cellDTO !== null) // Filtra celdas nulas
    );
  }

  /**
   * Retrieves the current number of fruits on the board.
   *
   * @return {number} The number of fruits on the board.
   */
  public getFruitsNumber(): number {
    return this.fruitsNumber;
  }

  /**
   * Retrieves the enemies present on the board.
   *
   * @return {Map<string, Enemy>} A map of enemies on the board.
   */
  public getEnemies(): Map<string, Enemy> {
    return this.enemies;
  }
  /**
   * Retrieves the host player of the match.
   *
   * @return {Player | null} The host player, or null if not set.
   */
  public getHost(): Player | null {
    return this.host;
  }

  /**
   * Retrieves the guest player of the match.
   *
   * @return {Player | null} The guest player, or null if not set.
   */
  public getGuest(): Player | null {
    return this.guest;
  }

  public abstract checkWin(): boolean;
  public abstract checkLose(): boolean;
  /**
   * Starts the game by setting up players and initializing enemies.
   *
   * @param {string} host The ID of the host player.
   * @param {string} guest The ID of the guest player.
   * @return {Promise<void>} A promise that resolves when the game starts.
   */
  public async startGame(host: string, guest: string): Promise<void> {
    this.setUpPlayers(host, guest);
    await this.startEnemies();
  }

  /**
   * Stops the game by terminating all worker threads.
   *
   * @return {Promise<void>} A promise that resolves when the game stops.
   */
  public async stopGame(): Promise<void> {
    for (const worker of this.workers) {
      await worker.terminate();
    }
    this.workers = [];
  }
}
export default Board;
