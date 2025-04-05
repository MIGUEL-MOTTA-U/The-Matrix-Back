import { resolve } from 'node:path';
import { Worker } from 'node:worker_threads';
import BoardError from '../../../../errors/BoardError.js';
import type { BoardDTO } from '../../../../schemas/zod.js';
import { logger } from '../../../../server.js';
import Troll from '../../characters/enemies/Troll.js';
import Player from '../../characters/players/Player.js';
import Board from './Board.js';
import Cell from './CellBoard.js';
import Fruit from './Fruit.js';
/**
 * Class to represent the board of the game
 * with a difficulty of 1 with troll enemies
 * @version 1.0
 * @since 1.0
 */
export default class BoardDifficulty1 extends Board {
  private ENEMIES = 0;
  private enemiesCoordinates: number[][] = [];
  private fruitsCoordinates: number[][] = [];
  private FRUITS = 0;
  private fruitsRounds = 0;
  private playersStartCoordinates: number[][] = [];

  constructor(map: string, level: number) {
    super(map, level);
    this.loadContext(); // We exec this method twice, because of TypeScript, it doesn't saves the statue assigned after we use the father constructor:)
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

  public checkLose(): boolean {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    return !this.host.isAlive() && !this.guest.isAlive();
  }

  public checkWin(): boolean {
    if (!this.host || !this.guest) throw new BoardError(BoardError.USER_NOT_DEFINED);
    return (
      this.fruitsNumber === 0 &&
      this.fruitsRounds === 0 &&
      (this.host.isAlive() || this.guest.isAlive())
    );
  }

  private createBoard(): void {
    for (let i = 0; i < this.ROWS; i++) {
      this.board[i] = [];
      for (let j = 0; j < this.COLS; j++) {
        this.board[i][j] = new Cell(i, j);
      }
    }
  }

  /**
   * Method to set up the enemies in the board
   */
  protected setUpEnemies(): void {
    for (let i = 0; i < this.ENEMIES; i++) {
      const x = this.enemiesCoordinates[i][0];
      const y = this.enemiesCoordinates[i][1];
      const troll = new Troll(this.board[x][y], this);
      this.enemies.set(troll.getId(), troll);
      this.board[x][y].setCharacter(troll);
    }
  }

  /**
   * This method sets up the fruits in the board
   */
  protected async setUpFruits(): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.fruitsNumber = this.FRUITS;
      for (let i = 0; i < this.FRUITS; i++) {
        const x = this.fruitsCoordinates[i][0];
        const y = this.fruitsCoordinates[i][1];
        if (this.board[x][y].getCharacter() === null || this.board[x][y].getCharacter()?.kill()) {
          const fruit = new Fruit(this.board[x][y], this.FRUIT_TYPE[0], this);
          this.fruits.set({ x, y }, fruit);
          this.board[x][y].setItem(fruit);
        } else {
          this.fruitsNumber--;
        }
      }
      this.FRUIT_TYPE.shift();
      this.fruitsRounds--;
    });
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

  public getFruits(): number {
    return this.FRUITS;
  }

  protected loadContext(): void {
    this.playersStartCoordinates = [
      [9, 1],
      [9, 14],
    ];
    this.enemiesCoordinates = [
      [2, 4],
      [2, 12],
      [14, 4],
      [14, 12],
    ];
    this.fruitsCoordinates = [
      [4, 5],
      [4, 6],
      [4, 7],
      [4, 8],
      [4, 9],
      [4, 10],
      [4, 11],
      [11, 5],
      [11, 6],
      [11, 7],
      [11, 8],
      [11, 9],
      [11, 10],
      [11, 11],
    ];
    this.FRUITS = this.fruitsCoordinates.length;
    this.FRUIT_TYPE = ['banana', 'grape'];
    this.ENEMIES = 4;
    this.fruitsRounds = 2;
  }

  public getBoardDTO(): BoardDTO {
    return {
      host: this.host?.getId() || null,
      guest: this.guest?.getId() || null,
      fruitType: this.FRUIT_TYPE[0],
      fruitsType: this.FRUIT_TYPE,
      enemies: this.ENEMIES,
      enemiesCoordinates: this.enemiesCoordinates,
      fruitsCoordinates: this.fruitsCoordinates,
      fruits: this.FRUITS,
      playersStartCoordinates: this.playersStartCoordinates,
      board: this.cellsBoardDTO(),
    };
  }

  protected setUpInmovableObjects(): void {
    // TODO --> Priority 3 <-- Implement this method
  }

  private async stop(): Promise<void> {
    // TODO --> Priority 2 <-- Implement this method
  }

  protected async startEnemies(matchId: string): Promise<void> {
    // Here I call the worker
    const fileName = resolve(__dirname, '../../../../../dist/src/workers/Enemies.worker.js');
    for (const enemy of this.enemies.values()) {
      const worker = new Worker(fileName, {
        workerData: {
          enemyId: enemy.getId(),
          matchId,
        },
      });
      worker.on('message', (_message) => {});
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

  public async win(): Promise<boolean> {
    await this.stop();
    return true;
  }
}
