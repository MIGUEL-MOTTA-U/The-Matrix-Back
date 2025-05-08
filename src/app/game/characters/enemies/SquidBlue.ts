import type { CellDTO, Direction } from '../../../../schemas/zod.js';
import Enemy from './Enemy.js';
/**
 * @class SquidBlue
 * @extends Enemy
 * Class representing a blue squid enemy.
 * It can unfreeze cells in front of it.
 *
 * @since 07/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class SquidBlue extends Enemy {
  /**
   * Calculates the movement of the squid enemy.
   * The squid attempts to unfreeze cells in front of it and move in the best direction towards the players.
   * @returns {Promise<void>} A promise that resolves when the movement is calculated.
   */
  public async calculateMovement(): Promise<void> {
    const canBreakFrozen = true;
    const bestDirection =
      this.board.getBestDirectionToPlayers(this.cell, canBreakFrozen) || this.orientation;
    try {
      const changes = await this.execPower(bestDirection);
      if (changes.length > 0) await this.notifyPlayers('update-frozen-cells', changes);
      await this.moveAlongPath(bestDirection);
      const enemyDTO = this.getCharacterUpdate(null);
      await this.notifyPlayers('update-enemy', enemyDTO);
    } catch (_error) {
      this.enemyState = 'stopped';
    }
  }

  /**
   * This method executes the squid's special power to unfreeze cells in front of it.
   *
   * @param {Direction} direction - The direction in which the squid will unfreeze cells.
   * @returns {Promise<CellDTO[]>} - A promise that resolves to an array of CellDTO objects representing the cells that were unfrozen.
   */
  public async execPower(direction: Direction): Promise<CellDTO[]> {
    return await this.mutex.runExclusive(() => {
      return this.cell.unfreezeFrontCells(direction, true);
    });
  }

  /**
   * This method retrieves the name of the SquidBlue enemy.
   * @returns {string} - The name of the enemy.
   */
  public getEnemyName(): string {
    return 'squid-blue';
  }
}
