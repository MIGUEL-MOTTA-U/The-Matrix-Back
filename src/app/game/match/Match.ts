import {
  type MatchDTO,
  type PlayerState,
  type UpdateAll,
  validatePlayerState,
  validateUpdateAll,
  validateUpdateTime,
} from '../../../schemas/zod.js';
import type Enemy from '../characters/enemies/Enemy.js';
import type Player from '../characters/players/Player.js';
import type Board from './boards/Board.js';
import BoardDifficulty1 from './boards/BoardDifficulty1.js';
class Match {
  private id: string; // Should be auto-generated
  private level: number;
  private map: string; // Should be a Map object
  private host: string;
  private guest: string;
  private started: boolean;
  private readonly board: Board;
  private timeSeconds: number;
  constructor(id: string, level: number, map: string, host: string, guest: string) {
    this.id = id;
    this.level = level;
    this.map = map;
    this.host = host;
    this.guest = guest;
    this.board = new BoardDifficulty1(this.map, this.level);
    this.started = false;
    this.timeSeconds = 300; // 5 minutes
  }
  public async initialize(): Promise<void> {
    await this.board.initialize();
  }

  public getMatchUpdate(): UpdateAll {
    const time = validateUpdateTime({
      minutesLeft: Math.floor(this.timeSeconds / 60),
      secondsLeft: this.timeSeconds % 60,
    });
    const players = this.getPlayers();
    const board = this.board.cellsBoardDTO();
    return validateUpdateAll({
      players,
      time,
      board,
    });
  }

  public getMatchDTO(): MatchDTO {
    return {
      id: this.id,
      level: this.level,
      map: this.map,
      host: this.host,
      guest: this.guest,
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

  public async startGame(): Promise<void> {
    if (this.started) return;
    await this.board.startGame(this.host, this.guest, this.id);
    this.started = true;
  }

  public checkWin(): boolean {
    return this.board.checkWin();
  }

  public checkLose(): boolean {
    return this.board.checkLose();
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
