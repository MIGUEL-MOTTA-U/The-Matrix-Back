import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { Mutex } from 'async-mutex';
import BoardError from '../../../../errors/BoardError.js';
import {
  type BoardDTO,
  type CellDTO,
  type UpdateFruits,
  parseCoordinatesToString,
  validateUpdateFruits,
} from '../../../../schemas/zod.js';
import type { CellCoordinates, Direction, GameMessageOutput } from '../../../../schemas/zod.js';
import { config, logger } from '../../../../server.js';
import { Graph } from '../../../../utils/Graph.js';
import type Enemy from '../../characters/enemies/Enemy.js';
import Player from '../../characters/players/Player.js';
import type Match from '../Match.js';
import Cell from './CellBoard.js';
import Fruit from './Fruit.js';
/**
 * @abstract class Board
 * Abstract class representing a game board.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
abstract class Board {
  protected readonly mutex = new Mutex();
  protected readonly ROWS: number;
  protected readonly COLS: number;
  protected readonly map: string;
  protected readonly level: number;
  protected readonly match: Match;
  protected readonly board: Cell[][];
  protected readonly enemies: Map<string, Enemy>;
  protected ENEMIES = 0;
  protected FRUITS = 0;
  protected ROCKS = 0;
  protected FRUIT_TYPE: string[] = [];
  protected FRUITS_CONTAINER: string[] = [];
  protected host: Player | null = null;
  protected guest: Player | null = null;
  protected fruitsNumber = 0;
  protected fruitsRounds = 0;
  protected currentRound = 0;
  protected workers: Worker[] = [];
  protected currentFruitType: string | undefined;
  protected enemiesCoordinates: number[][] = [];
  protected fruitsCoordinates: number[][] = [];
  protected playersStartCoordinates: number[][] = [];
  protected rocksCoordinates: number[][] = [];
  protected ENEMIES_SPEED = 1000; // Milliseconds

  //protected abstract generateBoard(): void;
  protected abstract setUpEnemies(): void;
  protected abstract setUpInmovableObjects(): void;
  protected abstract loadContext(): void;

  constructor(match: Match, map: string, level: number) {
    this.match = match;
    this.ROWS = 16;
    this.COLS = 16;
    this.board = [];
    this.enemies = new Map();
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
   * This method checks if the players lose the game.
   * @returns True if the game is over
   */
  public checkLose(): boolean {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    return !this.host.isAlive() && !this.guest.isAlive();
  }

  /**
   * This method returns a Data Transfer Object with the preliminar information
   * of the Board. It sends redundant data such as the array of coordinates of elements and the matrix
   * of the board, we might delete those arrays in the future.
   * @returns The Board DTO with the number of enemies, an array with the enemies coordinates,
   * the fruits number, the fruits coordinates, the start coordinates of the players and the matrix
   * of the board.
   */
  public getBoardDTO(): BoardDTO {
    return {
      enemiesNumber: this.ENEMIES,
      fruitsNumber: this.FRUITS,
      playersStartCoordinates: this.playersStartCoordinates,
      cells: this.cellsBoardDTO(),
    };
  }

  /**
   * This method checks if the players have won the game
   * @returns True if the players complete the fruits and the rounds. False Otherwise.
   */
  public checkWin(): boolean {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    return (
      this.fruitsNumber === 0 &&
      this.fruitsRounds === 0 &&
      (this.host.isAlive() || this.guest.isAlive())
    );
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
      if (this.fruitsNumber === 0 && this.FRUIT_TYPE.length > 0) {
        await this.setUpFruits();
        await this.match.notifyPlayers({ type: 'update-fruits', payload: this.getUpdateFruits() });
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

  public async notifyPlayers(data: GameMessageOutput): Promise<void> {
    this.match.notifyPlayers(data);
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

  public getBestPathPlayers(targetCell: Cell): Direction | null {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    // Certenly, the enemies can kill
    const mappedGraph = this.getMappedGraph(true);
    const hostPath = this.host.isAlive()
      ? this.host.getShortestPath(targetCell, mappedGraph)
      : null;
    const guestPath = this.guest.isAlive()
      ? this.guest.getShortestPath(targetCell, mappedGraph)
      : null;
    if (hostPath && guestPath) {
      return hostPath.distance < guestPath.distance ? hostPath.direction : guestPath.direction;
    }
    if (hostPath) {
      return hostPath.direction;
    }
    if (guestPath) {
      return guestPath.direction;
    }
    return null;
  }

  private getMappedGraph(canWalkOverPlayers: boolean): Graph {
    const graph = new Graph();
    for (let i = 0; i < this.ROWS; i++) {
      for (let j = 0; j < this.COLS; j++) {
        const cell = this.board[i][j];
        graph.addNode(parseCoordinatesToString(cell.getCoordinates()));
        if (!cell.blocked()) {
          const neighbors: Cell[] = cell.getNeighbors();
          for (const neighbor of neighbors) {
            // The neighbor exists, is not blocked
            const blocked = neighbor.blocked();
            const possibleCharacter = neighbor.getCharacter();
            if (
              !blocked &&
              (possibleCharacter === null || possibleCharacter?.kill() === canWalkOverPlayers)
            ) {
              graph.addEdge(
                parseCoordinatesToString(cell.getCoordinates()),
                parseCoordinatesToString(neighbor.getCoordinates())
              );
            }
          }
        }
      }
    }
    return graph;
  }

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

  protected createBoard(): void {
    for (let i = 0; i < this.ROWS; i++) {
      this.board[i] = [];
      for (let j = 0; j < this.COLS; j++) {
        this.board[i][j] = new Cell(i, j);
      }
    }
  }

  /**
   * Method to generate the board
   */
  protected generateBoard(): void {
    this.createBoard();
    for (let i = 0; i < this.ROWS; i++) {
      for (let j = 0; j < this.COLS; j++) {
        const cellUp = i > 0 ? this.board[i - 1][j] : null;
        const cellDown = i < this.ROWS - 1 ? this.board[i + 1][j] : null;
        const cellLeft = j > 0 ? this.board[i][j - 1] : null;
        const cellRight = j < this.COLS - 1 ? this.board[i][j + 1] : null;
        this.board[i][j].setNeighbors(cellUp, cellDown, cellLeft, cellRight);
      }
    }
  }

  protected getRowCoordinatesInRange(row: number, start: number, end: number): number[][] {
    return Array.from({ length: end - start + 1 }, (_, i) => [row, start + i]);
  }

  /**
   * This method starts the enemies in the board
   */
  protected async startEnemies(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const enemiesSpeed = this.ENEMIES_SPEED;
    const fileName =
      config.NODE_ENV === 'development'
        ? resolve(__dirname, '../../../../../dist/src/workers/Enemies.worker.js')
        : resolve(__dirname, '../../../../workers/Enemies.worker.js');
    for (const enemy of this.enemies.values()) {
      const worker = new Worker(fileName, { workerData: { enemiesSpeed } });
      this.workers.push(worker);
      worker.on('message', async (_message) => {
        if (this.checkLose() || this.match.checkWin()) {
          await this.stopGame();
          return;
        }
        await enemy.calculateMovement();
        const enemyDTO = enemy.getCharacterUpdate(null);
        await this.match.notifyPlayers({ type: 'update-enemy', payload: enemyDTO });
      });

      worker.on('error', (error) => {
        logger.warn('An error occurred while running the enemies worker');
        logger.error(error);
      });
      worker.on('exit', (code) => {
        if (code !== 0) logger.warn(`Enemies worker stopped with exit code ${code}`);
        else logger.info('Enemies worker finished');
      });
    }
  }

  /**
   * Method to set up the players in the board
   */
  protected setUpPlayers(host: string, guest: string): void {
    const [hostCoordinates, guestCoordinates] = this.playersStartCoordinates;
    const hostPlayer = new Player(this.board[hostCoordinates[0]][hostCoordinates[1]], this, host);
    const guestPlayer = new Player(
      this.board[guestCoordinates[0]][guestCoordinates[1]],
      this,
      guest
    );
    this.host = hostPlayer;
    this.guest = guestPlayer;
    this.board[hostCoordinates[0]][hostCoordinates[1]].setCharacter(this.host);
    this.board[guestCoordinates[0]][guestCoordinates[1]].setCharacter(this.guest);
  }

  /**
   * This method sets up the fruits in the board
   */
  protected async setUpFruits(): Promise<void> {
    this.fruitsNumber = this.FRUITS;
    this.currentFruitType = this.FRUIT_TYPE[0];
    for (let i = 0; i < this.FRUITS; i++) {
      const x = this.fruitsCoordinates[i][0];
      const y = this.fruitsCoordinates[i][1];
      if (this.board[x][y].getCharacter() === null || this.board[x][y].getCharacter()?.kill()) {
        const fruit = new Fruit(this.board[x][y], this.FRUIT_TYPE[0], this);
        this.board[x][y].setItem(fruit);
      } else {
        this.fruitsNumber--;
      }
    }
    this.FRUIT_TYPE.shift();
    this.fruitsRounds--;
    this.currentRound++;
  }

  private getEnemiesSpeed(): number {
    return this.ENEMIES_SPEED;
  }

  private getColCoordinatesInRange(col: number, start: number, end: number): number[][] {
    return Array.from({ length: end - start + 1 }, (_, i) => [start + i, col]);
  }
}
export default Board;
