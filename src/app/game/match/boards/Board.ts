import type { Worker } from 'node:worker_threads';
import { Mutex } from 'async-mutex';
import type { BoardDTO, CellDTO } from '../../../../schemas/zod.js';
import type { CellCoordinates } from '../../../../schemas/zod.js';
import type Enemy from '../../characters/enemies/Enemy.js';
import type Player from '../../characters/players/Player.js';
import type Match from '../Match.js';
import type Cell from './CellBoard.js';
import type Fruit from './Fruit.js';
abstract class Board {
  protected FRUIT_TYPE: string[] = [];
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
  protected workers: Worker[] = [];

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

  public async initialize(): Promise<void> {
    await this.setUpFruits();
  }

  public async removeFruit({ x, y }: CellCoordinates): Promise<void> {
    this.mutex.runExclusive(() => {
      this.board[x][y].setItem(null);
      this.fruitsNumber--;
      this.fruits.delete({ x, y });
      if (this.fruitsNumber === 0 && this.FRUIT_TYPE.length > 0) {
        this.setUpFruits();
      }
    });
  }

  public getBoard(): Cell[][] {
    return this.board;
  }
  public cellsBoardDTO(): CellDTO[] {
    return this.board.flatMap(
      (row) =>
        row
          .map((cell) => cell.getCellDTO())
          .filter((cellDTO): cellDTO is CellDTO => cellDTO !== null) // Filtra celdas nulas
    );
  }
  public getFruitsNumber(): number {
    return this.fruitsNumber;
  }
  public getEnemies(): Map<string, Enemy> {
    return this.enemies;
  }
  public getHost(): Player | null {
    return this.host;
  }

  public getGuest(): Player | null {
    return this.guest;
  }

  public abstract checkWin(): boolean;
  public abstract checkLose(): boolean;
  public async startGame(host: string, guest: string): Promise<void> {
    this.setUpPlayers(host, guest);
    await this.startEnemies();
  }

  public async stopGame(): Promise<void> {
    for (const worker of this.workers) {
      console.info('Terminating worker:', worker.threadId);
      await worker.terminate();
    }
    this.workers = [];
  }
}
export default Board;
