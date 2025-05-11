import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { Mutex } from 'async-mutex';
import {
  type BoardStorage,
  type GameMessageOutput,
  type MatchDTO,
  type MatchStorage,
  type PlayerState,
  type PlayerStorage,
  type UpdateAll,
  type UpdateTime,
  validatePlayerState,
  validateUpdateAll,
  validateUpdateTime,
} from '../../../schemas/zod.js';
import { config, logger } from '../../../server.js';
import type Player from '../characters/players/Player.js';
import type GameService from '../services/GameService.js';
import type Board from './boards/Board.js';
import BoardFactory from './boards/BoardFactory.js';
/**
 * @class Match
 * Class representing a match between two players.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Match {
  private readonly mutex: Mutex;
  private readonly id: string;
  private readonly level: number;
  private readonly map: string;
  private readonly host: string;
  private readonly guest: string;
  private readonly board: Board;
  private readonly gameService: GameService;
  private started: boolean;
  private running: boolean;
  private fruitGenerated: boolean;
  private paused: boolean;
  private timeSeconds: number;
  private worker: Worker | null = null;
  constructor(
    gameService: GameService,
    id: string,
    level: number,
    map: string,
    host: string,
    guest: string,
    paused = false
  ) {
    this.gameService = gameService;
    this.id = id;
    this.level = level;
    this.mutex = new Mutex();
    this.map = map;
    this.host = host;
    this.guest = guest;
    this.board = BoardFactory.createBoard(this, this.map, this.level);
    this.started = false;
    this.paused = paused;
    this.fruitGenerated = false;
    this.timeSeconds = config.MATCH_TIME_SECONDS; // default time in seconds is 300
    this.running = true;
  }

  /**
   * Retrieves the board of the match.
   *
   * @return {Board} The board of the match.
   */
  public initialize(): void {
    this.board.initialize();
  }

  /**
   * Loads the board with the given storage data.
   *
   * @param {BoardStorage} boardStorage The storage data for the board.
   * @param {PlayerStorage} host The storage data for the host player.
   * @param {PlayerStorage} guest The storage data for the guest player.
   */
  public loadBoard(boardStorage: BoardStorage, host: PlayerStorage, guest: PlayerStorage): void {
    this.board.loadBoard(boardStorage, host, guest);
  }

  /**
   * Retrieves the storage data of the match, including players and board.
   *
   * @return {Promise<MatchStorage>} A promise that resolves to the match storage data.
   */
  public async getMatchStorage(): Promise<MatchStorage> {
    const { hostStorage, guestStorage } = this.board.getPlayersStorage() as {
      hostStorage: PlayerStorage;
      guestStorage: PlayerStorage;
    };
    const boardStorage = await this.board.getBoardStorage();
    return {
      id: this.id,
      level: this.level,
      map: this.map,
      host: hostStorage,
      guest: guestStorage,
      board: boardStorage,
      timeSeconds: this.timeSeconds,
      typeFruits: this.board.getFruitTypes(),
      fruitGenerated: this.fruitGenerated,
      paused: this.paused,
    };
  }

  /**
   * Return state of the match if paused.
   * @returns {boolean} true if paused, false otherwise
   */
  public async isPaused(): Promise<boolean> {
    return await this.mutex.runExclusive(() => {
      return this.paused;
    });
  }

  /**
   * Checks if the match is currently running.
   *
   * @return {boolean} True if the match is running, false otherwise.
   */
  public isRunning(): boolean {
    return this.running;
  }
  /**
   * Pause the match for both players.
   * @returns {Promise<void>} Void promise when the match is paused.
   */
  public async pauseMatch(): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.paused = true;
    });
  }

  /**
   * Resumes the match
   * @returns {Promise<void>} Void promise when the match is resumed.
   */
  public async resumeMatch(): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.paused = false;
    });
  }

  /**
   * Retrieves the current time of the match.
   *
   * @return {UpdateTime} An object containing the remaining time of the match.
   */
  public getUpdateTime(): UpdateTime {
    return validateUpdateTime({
      minutesLeft: Math.floor(this.timeSeconds / 60),
      secondsLeft: this.timeSeconds % 60,
    });
  }

  /**
   * Sends updates to the players, such as enemy movement, player movement, or fruit updates.
   *
   * @param {GameMessageOutput} data The data to be sent to the players.
   * @return {Promise<void>} A promise that resolves when the players are notified.
   */
  public async notifyPlayers(data: GameMessageOutput): Promise<void> {
    if (this.running) {
      await this.gameService.updatePlayers(this.id, this.host, this.guest, data);
    }
  }

  /**
   * Retrieves the current data of the match, including players, board, and time.
   *
   * @return {UpdateAll} An object containing the current data of the match.
   */
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

  /**
   * Retrieves the match details as a DTO.
   *
   * @return {MatchDTO} An object containing the match details.
   */
  public getMatchDTO(): MatchDTO {
    return {
      id: this.id,
      level: this.level,
      map: this.map,
      hostId: this.host,
      guestId: this.guest,
      typeFruits: this.board.getFruitTypes(),
      board: this.board.getBoardDTO(),
    };
  }

  /**
   * Retrieves the player with the given ID.
   *
   * @param {string} id The ID of the player.
   * @return {Player | null} The player if found, or null otherwise.
   */
  public getPlayer(id: string): Player | null {
    const player = id === this.host ? this.board.getHost() : this.board.getGuest();
    return player;
  }

  /**
   * Retrieves the ID of the match.
   *
   * @return {string} The ID of the match.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Retrieves the ID of the host player.
   *
   * @return {string} The host player's ID.
   */
  public getHost(): string {
    return this.host;
  }

  /**
   * Retrieves the ID of the guest player.
   *
   * @return {string} The guest player's ID.
   */
  public getGuest(): string {
    return this.guest;
  }

  /**
   * Starts the game, including initializing the board, enemies, and time.
   *
   * @return {Promise<void>} A promise that resolves when the game starts.
   */
  public async startGame(): Promise<void> {
    if (this.started) return;
    await this.board.startGame(this.host, this.guest);
    await this.startTimeMatch();
    this.started = true;
  }

  /**
   * Stops the game, including stopping the board, enemies, and time.
   *
   * @return {Promise<void>} A promise that resolves when the game stops.
   */
  public async stopGame(): Promise<void> {
    if (this.running) {
      this.running = false;
      await this.stopTime();
      await this.board.stopGame();
    }
  }

  /**
   * Checks if the players have won the match.
   *
   * @return {boolean} True if the players have won, false otherwise.
   */
  public checkWin(): boolean {
    return this.board.checkWin();
  }

  /**
   * Checks if the players have lost the match.
   *
   * @return {boolean} True if the players have lost, false otherwise.
   */
  public checkLose(): boolean {
    return this.board.checkLose() || this.timeSeconds <= 0;
  }

  /**
   * Updates the match time and notifies the players.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the time is updated.
   */
  private async updateTimeMatch(): Promise<void> {
    if (this.timeSeconds > 0) {
      this.timeSeconds -= 1;
    }
    await this.gameService.updateTimeMatch(this.id, this.getUpdateTime());
  }

  /**
   * Starts the match timer using a worker thread.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the timer starts.
   */
  private async startTimeMatch(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const timerSpeed = config.TIMER_SPEED_MS;
    const fileName =
      config.NODE_ENV === 'development'
        ? resolve(__dirname, '../../../../dist/src/workers/clock.js')
        : resolve(__dirname, '../../../workers/clock.js');
    this.worker = new Worker(fileName, { workerData: { timerSpeed } });

    this.worker.on('message', async (_message) => {
      if (await this.isPaused()) return;
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

  /**
   * Stops the match timer and terminates the worker thread.
   *
   * @private
   * @return {Promise<void>} A promise that resolves when the timer stops.
   */
  private async stopTime(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Retrieves the current state of the players in the match.
   *
   * @private
   * @return {PlayerState[]} An array of player states.
   */
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
