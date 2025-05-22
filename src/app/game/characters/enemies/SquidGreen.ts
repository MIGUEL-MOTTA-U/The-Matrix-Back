import type { CellDTO, EnemiesTypes } from '../../../../schemas/zod.js';
import { logger } from '../../../../server.js';
import Enemy from './Enemy.js';
/**
 * @class SquidGreen
 * @extends Enemy
 * Class representing a green squid enemy.
 *
 * @since 06/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class SquidGreen extends Enemy {
  /**
   * Calculate the movement of the squid enemy
   * @returns {Promise<void>} - A promise that resolves when the movement is calculated.
   */
  public async calculateMovement(): Promise<void> {
    const canBreakFrozen = true;
    const bestDirection =
      this.board.getBestDirectionToPlayers(this.cell, canBreakFrozen) ?? this.orientation;
    try {
      const changes = await this.execPower();
      if (changes.length > 0) await this.notifyPlayers('update-frozen-cells', changes);
      await this.moveAlongPath(bestDirection);
      const enemyDTO = this.getCharacterUpdate(null);
      await this.notifyPlayers('update-enemy', enemyDTO);
    } catch (error) {
      this.enemyState = 'stopped';
      logger.debug(
        `SquidGreen ${this.id} cannot move in the direction ${bestDirection}. Error: ${error}`
      );
    }
  }

  /**
   * Executes the squid's special power to unfreeze cells around it.
   * @returns {Promise<CellDTO[]>} - A promise that resolves to an array of CellDTO objects representing the cells that were unfrozen.
   */
  public async execPower(): Promise<CellDTO[]> {
    return await this.mutex.runExclusive(() => {
      return this.cell.unfreezeCellsAround();
    });
  }

  public getEnemyName(): EnemiesTypes {
    return 'squid-green';
  }
}
