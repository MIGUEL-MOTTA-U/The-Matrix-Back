import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { config, logger } from '../../../../../server.js';
import Troll from '../../../characters/enemies/Troll.js';
import type Match from '../../Match.js';
import Board from '../Board.js';
/**
 * @class Level1Board
 * Class to represent the board of the game
 * with a difficulty of 1 with troll enemies
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Level1Board extends Board {
  constructor(match: Match, map: string, level: number) {
    super(match, map, level);
    this.loadContext(); // We exec this method twice, because of TypeScript, it doesn't saves the status assigned after we use the father constructor:)
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
   * This method generates the board with the map
   */
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
      ...this.getRowCoordinatesInRange(4, 5, 11),
      ...this.getRowCoordinatesInRange(11, 5, 11),
    ];
    this.FRUITS = this.fruitsCoordinates.length;
    this.FRUIT_TYPE = ['banana', 'grape'];
    this.FRUITS_CONTAINER = [...this.FRUIT_TYPE];
    this.ENEMIES = 4;
    this.fruitsRounds = this.FRUIT_TYPE.length;
  }

  /**
   * This method sets up the immovable objects in the board
   */
  protected setUpInmovableObjects(): void {
    // TODO --> Priority 3 <-- Implement this method
  }

  /**
   * This method starts the enemies in the board
   */
  protected async startEnemies(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fileName =
      config.NODE_ENV === 'development' || config.NODE_ENV === 'test'
        ? resolve(__dirname, '../../../../../dist/src/workers/Enemies.worker.js')
        : resolve(__dirname, '../../../../workers/Enemies.worker.js');
    for (const enemy of this.enemies.values()) {
      const worker = new Worker(fileName);
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
}
