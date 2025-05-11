import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { Mutex } from 'async-mutex';
import BoardError from '../../../../errors/BoardError.js';
import {
  type BoardDTO,
  type BoardItem,
  type BoardItemDTO,
  type BoardStorage,
  type CellCoordinates,
  type CellDTO,
  type Direction,
  type GameMessageOutput,
  type PathResultWithDirection,
  type PlayerStorage,
  type PlayersPaths,
  type UpdateFruits,
  enemiesConst,
  parseCoordinatesToString,
  validateUpdateFruits,
} from '../../../../schemas/zod.js';
import { config, logger } from '../../../../server.js';
import { Graph } from '../../../../utils/Graph.js';
import type Character from '../../characters/Character.js';
import type Enemy from '../../characters/enemies/Enemy.js';
import Player from '../../characters/players/Player.js';
import type Match from '../Match.js';
import Cell from './CellBoard.js';
import Fruit from './Fruit.js';
import Rock from './Rock.js';
/**
 * @abstract class Board
 * Abstract class representing a game board.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
abstract class Board {
  protected freezedCells: number[][];
  protected readonly mutex = new Mutex();
  protected readonly ROWS = 16;
  protected readonly COLS = 16;
  protected readonly map: string;
  protected readonly level: number;
  protected readonly match: Match;
  protected readonly board: Cell[][];
  protected readonly enemies: Map<string, Enemy>;
  protected NUMENEMIES = 0;
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
  protected abstract getBoardEnemy(cell: Cell, id?: string, orientation?: Direction): Enemy;
  protected abstract loadContext(): void;

  /**
   * Default Constructor for the Board class.
   *
   * @param {Match} match - The match instance associated with this board.
   * @param {string} map - The map string representing the board layout.
   * @param {number} level - The level of the game.
   */
  constructor(match: Match, map: string, level: number) {
    this.match = match;
    this.board = [];
    this.freezedCells = [];
    this.enemies = new Map();
    this.map = map;
    this.level = level;
  }
  public loadBoard(boardStorage: BoardStorage, host: PlayerStorage, guest: PlayerStorage): void {
    this.generateBoard();
    this.setUpPlayers(host.id, guest.id, host, guest);
    this.FRUIT_TYPE = boardStorage.fruitType;
    this.FRUITS_CONTAINER = boardStorage.fruitsContainer;
    this.fruitsNumber = boardStorage.fruitsNumber;
    this.fruitsRounds = boardStorage.fruitsRound;
    this.currentRound = boardStorage.currentRound;
    this.currentFruitType = boardStorage.currentFruitType;
    this.rocksCoordinates = boardStorage.rocksCoordinates;
    this.fruitsCoordinates = boardStorage.fruitsCoordinates;
    this.loadCells(boardStorage.board);
  }
  /**
   * Loads the default context for the board, including generating the board,
   */
  private loadDefaultContext(): void {
    this.loadContext();
    this.generateBoard();
    this.setUpEnemies();
    this.setUpInmovableObjects();
  }

  public getPlayersStorage(): { hostStorage: PlayerStorage; guestStorage: PlayerStorage } {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    const hostStorage: PlayerStorage = this.host.getPlayerStorage();
    const guestStorage: PlayerStorage = this.guest.getPlayerStorage();
    return { hostStorage, guestStorage };
  }

  public async getBoardStorage(): Promise<BoardStorage> {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    return this.mutex.runExclusive(() => {
      return {
        fruitType: this.FRUIT_TYPE,
        fruitsContainer: this.FRUITS_CONTAINER,
        fruitsNumber: this.fruitsNumber,
        fruitsRound: this.fruitsRounds,
        currentRound: this.currentRound,
        currentFruitType: this.calcultateCurrentFruitType(),
        rocksCoordinates: this.rocksCoordinates,
        fruitsCoordinates: this.fruitsCoordinates,
        board: this.cellsBoardDTO(),
      };
    });
  }

  private calcultateCurrentFruitType(): string {
    const index = this.currentRound === 0 ? 0 : this.currentRound - 1;
    const currentType = this.FRUITS_CONTAINER[index];
    return currentType;
  }

  /**
   * This method sets up the board with the given cells
   * @param {CellDTO[]} cells - The cells to set up the board with.
   */
  private loadCells(cells: CellDTO[]): void {
    for (const cell of cells) {
      const { x, y } = cell.coordinates;
      const cellBoard = this.board[x][y];
      const character = cell.character;
      const item = cell.item;
      if (character) cellBoard.setCharacter(this.characterFactory(character, cellBoard));
      if (item) cellBoard.setItem(this.boardItemFactory(item, cellBoard));
      if (cell.frozen) cellBoard.setFrozen(true);
    }
  }

  /**
   * Sets up the fruits on the board after it is generated.
   *
   * @return {void} A promise that resolves when the fruits are set up.
   */
  public initialize(): void {
    this.loadDefaultContext();
    this.setUpFruits();
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
      enemiesNumber: this.NUMENEMIES,
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
        this.setUpFruits();
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

  public getBestDirectionToPlayers(targetCell: Cell, canBreakFrozen: boolean): Direction | null {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    // Certainly, the enemies can kill
    const bestPath = this.getBestPathToPlayers(targetCell, canBreakFrozen);
    if (bestPath) return bestPath.direction;
    return null;
  }

  public getBestPathToPlayers(
    targetCell: Cell,
    canBreakFrozen: boolean
  ): PathResultWithDirection | null {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    const { hostPath, guestPath } = this.getPlayersPaths(targetCell, canBreakFrozen);
    if (hostPath && guestPath) {
      return hostPath.distance < guestPath.distance ? hostPath : guestPath;
    }
    if (hostPath) {
      return hostPath;
    }
    if (guestPath) {
      return guestPath;
    }
    return null;
  }

  public getPlayersPaths(targetCell: Cell, canBreakFrozen: boolean): PlayersPaths {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    const mappedGraph = this.getMappedGraph(true, canBreakFrozen);
    const hostPath = this.host.isAlive()
      ? this.host.getShortestDirectionToCharacter(targetCell, mappedGraph)
      : null;
    const guestPath = this.guest.isAlive()
      ? this.guest.getShortestDirectionToCharacter(targetCell, mappedGraph)
      : null;
    return {
      hostPath,
      guestPath,
    };
  }

  private getMappedGraph(canWalkOverPlayers: boolean, canBreakFrozen: boolean): Graph {
    const graph = new Graph();
    for (let i = 0; i < this.ROWS; i++) {
      for (let j = 0; j < this.COLS; j++) {
        const cell = this.board[i][j];
        graph.addNode(parseCoordinatesToString(cell.getCoordinates()));
        if (this.isAvailableCell(cell, canBreakFrozen)) {
          const neighbors: Cell[] = cell.getNeighbors();
          this.mapNeighborsToGraph(neighbors, canBreakFrozen, canWalkOverPlayers, graph, cell);
        }
      }
    }
    return graph;
  }

  private isAvailableCell(cell: Cell, canBreakFrozen: boolean): boolean {
    return !cell.blocked() && (canBreakFrozen || !cell.isFrozen());
  }

  private mapNeighborsToGraph(
    neighbors: Cell[],
    canBreakFrozen: boolean,
    canWalkOverPlayers: boolean,
    graph: Graph,
    cell: Cell
  ): void {
    for (const neighbor of neighbors) {
      // The neighbor exists, is not blocked
      const blocked = neighbor.blocked() || (canBreakFrozen ? false : neighbor.isFrozen());
      const possibleCharacter = neighbor.getCharacter();
      if (this.isAvailableNeighbor(blocked, possibleCharacter, canWalkOverPlayers)) {
        graph.addEdge(
          parseCoordinatesToString(cell.getCoordinates()),
          parseCoordinatesToString(neighbor.getCoordinates())
        );
      }
    }
  }

  private isAvailableNeighbor(
    blocked: boolean,
    possibleCharacter: Character | null,
    canWalkOverPlayers: boolean
  ): boolean {
    return (
      !blocked && (possibleCharacter === null || possibleCharacter?.kill() === canWalkOverPlayers)
    );
  }

  /**
   * Starts the game by setting up players and initializing enemies.
   *
   * @param {string} host The ID of the host player.
   * @param {string} guest The ID of the guest player.
   * @return {Promise<void>} A promise that resolves when the game starts.
   */
  public async startGame(host: string, guest: string): Promise<void> {
    if (!this.host || !this.guest) this.setUpPlayers(host, guest);
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
        const isPaused = await this.match.isPaused();
        if (isPaused) return;
        await this.handleEnemyMovement(enemy);
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

  protected async handleEnemyMovement(enemy: Enemy): Promise<void> {
    if (this.checkLose() || this.match.checkWin()) {
      await this.stopGame();
      return;
    }
    await enemy.calculateMovement();
    const enemyDTO = enemy.getCharacterUpdate(null);
    await this.notifyPlayers({ type: 'update-enemy', payload: enemyDTO });
  }

  /**
   * Method to set up the players in the board
   */
  protected setUpPlayers(
    host: string,
    guest: string,
    hostStorage?: PlayerStorage,
    guestStorage?: PlayerStorage
  ): void {
    const [hostPositions, guestPositions] =
      hostStorage === undefined || guestStorage === undefined
        ? this.playersStartCoordinates
        : [
            [hostStorage.coordinates.x, hostStorage.coordinates.y],
            [guestStorage.coordinates.x, guestStorage.coordinates.y],
          ];
    const hostState = hostStorage ? hostStorage.state === 'alive' : true;
    const guestState = guestStorage ? guestStorage.state === 'alive' : true;
    const hostPlayer = new Player(
      this.board[hostPositions[0]][hostPositions[1]],
      this,
      host,
      hostStorage?.color,
      hostStorage?.direction,
      hostState
    );
    const guestPlayer = new Player(
      this.board[guestPositions[0]][guestPositions[1]],
      this,
      guest,
      guestStorage?.color,
      guestStorage?.direction,
      guestState
    );
    this.host = hostPlayer;
    this.guest = guestPlayer;
    this.board[hostPositions[0]][hostPositions[1]].setCharacter(this.host);
    this.board[guestPositions[0]][guestPositions[1]].setCharacter(this.guest);
  }

  /**
   * This method sets up the fruits in the board
   */
  protected setUpFruits(): void {
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

  private boardItemFactory(boardItemDTO: BoardItemDTO, cell: Cell): BoardItem {
    if (!this.currentFruitType) throw new BoardError(BoardError.FRUIT_TYPE_NOT_DEFINED);
    switch (boardItemDTO.type) {
      case 'rock':
        return new Rock(cell, this, boardItemDTO.id);
      case 'fruit':
        return new Fruit(cell, this.currentFruitType, this);
      default:
        throw new BoardError(BoardError.INVALID_ITEM_TYPE);
    }
  }

  private characterFactory(boardItemDTO: BoardItemDTO, cell: Cell): Character {
    if (enemiesConst.includes(boardItemDTO.type)) {
      const enemy = this.getBoardEnemy(cell, boardItemDTO.id, boardItemDTO.orientation);
      this.enemies.set(enemy.getId(), enemy);
      return enemy;
    }
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    const character = boardItemDTO.id === this.host.getId() ? this.host : this.guest;
    return character;
  }

  /**
   * This method sets up the enemies in the board
   */
  protected setUpEnemies(): void {
    for (let i = 0; i < this.NUMENEMIES; i++) {
      const x = this.enemiesCoordinates[i][0];
      const y = this.enemiesCoordinates[i][1];
      const troll = this.getBoardEnemy(this.board[x][y]);
      this.enemies.set(troll.getId(), troll);
      this.board[x][y].setCharacter(troll);
    }
  }

  protected getColCoordinatesInRange(col: number, start: number, end: number): number[][] {
    return Array.from({ length: end - start + 1 }, (_, i) => [start + i, col]);
  }

  protected getRowCoordinatesInRange(row: number, start: number, end: number): number[][] {
    return Array.from({ length: end - start + 1 }, (_, i) => [row, start + i]);
  }

  protected getSquareCoordinatesInRange(
    size: number,
    rowStart: number,
    colStart: number,
    colEnd: number
  ): number[][] {
    return Array.from({ length: size }, (_, i) => i + rowStart).flatMap((row) =>
      this.getRowCoordinatesInRange(row, colStart, colEnd)
    );
  }

  protected setUpInmovableObjects(): void {
    for (let i = 0; i < this.ROCKS; i++) {
      const x = this.rocksCoordinates[i][0];
      const y = this.rocksCoordinates[i][1];
      if (this.board[x][y].getCharacter() === null) {
        const rock = new Rock(this.board[x][y], this);
        this.board[x][y].setItem(rock);
      }
    }
    for (const freezedCell of this.freezedCells) {
      const x = freezedCell[0];
      const y = freezedCell[1];
      if (this.board[x][y].getCharacter() === null && this.board[x][y].isFrozen() === false) {
        this.board[x][y].setFrozen(true);
      }
    }
  }

  protected loadConstants(): void {
    this.ROCKS = this.rocksCoordinates.length;
    this.FRUITS = this.fruitsCoordinates.length;
    this.FRUITS_CONTAINER = [...this.FRUIT_TYPE];
    this.NUMENEMIES = this.enemiesCoordinates.length;
    this.fruitsRounds = this.FRUIT_TYPE.length;
  }
}
export default Board;
