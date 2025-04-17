import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import {
  type MatchDTO,
  type PlayerMove,
  type PlayerState,
  type UpdateAll,
  type UpdateEnemy,
  type UpdateFruits,
  type UpdateTime,
  validatePlayerState,
  validateUpdateAll,
  validateUpdateTime,
} from '../../../schemas/zod.js';
import { config, logger } from '../../../server.js';
import type Enemy from '../characters/enemies/Enemy.js';
import type Player from '../characters/players/Player.js';
import type GameService from '../services/GameService.js';
import type Board from './boards/Board.js';
import BoardDifficulty1 from './boards/BoardDifficulty1.js';
class Match {
  private readonly id: string;
  private readonly level: number;
  private readonly map: string;
  private readonly host: string;
  private readonly guest: string;
  private readonly board: Board;
  private readonly gameService: GameService;
  private started: boolean;
  private running: boolean;
  private timeSeconds: number;
  private worker: Worker | null = null;
  constructor(
    gameService: GameService,
    id: string,
    level: number,
    map: string,
    host: string,
    guest: string
  ) {
    this.gameService = gameService;
    this.id = id;
    this.level = level;
    this.map = map;
    this.host = host;
    this.guest = guest;
    this.board = new BoardDifficulty1(this, this.map, this.level);
    this.started = false;
    this.timeSeconds = config.MATCH_TIME_SECONDS; // default time in seconds is 300
    this.running = true;
  }

  public isRunning(): boolean {
    return this.running;
  }
  public async initialize(): Promise<void> {
    await this.board.initialize();
  }

  public getUpdateTime(): UpdateTime {
    return validateUpdateTime({
      minutesLeft: Math.floor(this.timeSeconds / 60),
      secondsLeft: this.timeSeconds % 60,
    });
  }

  public async notifyPlayers(data: UpdateEnemy | PlayerMove | UpdateFruits): Promise<void> {
    this.gameService.updatePlayers(this.id, this.host, this.guest, data);
  }

  public getMatchUpdate(): UpdateAll {
    const time = this.getUpdateTime();
    const players = this.getPlayers();
    const board = this.board.cellsBoardDTO();
    return validateUpdateAll({
      players,
      cells: board,
      time,
    });
  }

  public getMatchDTO(): MatchDTO {
    return {
      id: this.id,
      level: this.level,
      map: this.map,
      hostId: this.host,
      guestId: this.guest,
      board: this.board.getBoardDTO(),
    };
  }

  public getEnemies(): Map<string, Enemy> {
    return this.board.getEnemies();
  }

  public getPlayer(id: string): Player | null {
    const player = id === this.host ? this.board.getHost() : this.board.getGuest();
    return player;
  }

  public getId(): string {
    return this.id;
  }

  public getHost(): string {
    return this.host;
  }

  public getGuest(): string {
    return this.guest;
  }
  private async updateTimeMatch(): Promise<void> {
    if (this.timeSeconds > 0) {
      this.timeSeconds -= 1;
    }
    await this.gameService.updateTimeMatch(this.id, this.getUpdateTime());
  }
  public async startGame(): Promise<void> {
    if (this.started) return;
    await this.board.startGame(this.host, this.guest);
    await this.startTimeMatch();
    this.started = true;
  }

  private async startTimeMatch(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fileName =
      config.NODE_ENV === 'development'
        ? resolve(__dirname, '../../../../dist/src/workers/clock.js')
        : resolve(__dirname, '../../../workers/clock.js');
    this.worker = new Worker(fileName);

    this.worker.on('message', async (_message) => {
      if (this.timeSeconds <= 0) {
        await this.stopTime();
        return;
      }
      await this.updateTimeMatch();
    });

    this.worker.on('error', (error) => {
      logger.warn('An error occurred while running the time worker');
      logger.error(error);
    });

    this.worker.on('exit', (code) => {
      if (code !== 0) logger.warn(`Time worker stopped with exit code ${code}`);
      else logger.info('Time worker finished');
    });
  }

  private async stopTime(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  public async stopGame(): Promise<void> {
    if (this.running) {
      await this.stopTime();
      await this.board.stopGame();
      this.running = false;
    }
  }

  public checkWin(): boolean {
    return this.board.checkWin();
  }

  public checkLose(): boolean {
    return this.board.checkLose() || this.timeSeconds <= 0;
  }

  private getPlayers(): PlayerState[] {
    return [
      validatePlayerState({
        id: this.host,
        state: this.board.getHost()?.getState(),
      }),
      validatePlayerState({
        id: this.guest,
        state: this.board.getGuest()?.getState(),
      }),
    ];
  }
}
export default Match;
