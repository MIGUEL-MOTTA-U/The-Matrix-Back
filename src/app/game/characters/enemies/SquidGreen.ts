import {
  type CellDTO,
  type UpdateEnemy,
  validateGameMessageOutput,
} from '../../../../schemas/zod.js';
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
      this.board.getBestDirectionToPlayers(this.cell, canBreakFrozen) || this.orientation;
    try {
      const changes = await this.execPower();
      if (changes.length > 0) await this.notifyPlayers('update-frozen-cells', changes);
      await this.moveAlongPath(bestDirection);
      const enemyDTO = this.getCharacterUpdate(null);
      await this.notifyPlayers('update-enemy', enemyDTO);
    } catch (_error) {
      // Do nothing if the squid cannot move. It will just stay in its current position.
    }
  }

  public async execPower(): Promise<CellDTO[]> {
    return await this.mutex.runExclusive(() => {
      return this.cell.unfreezeCellsAround();
    });
  }

  private async notifyPlayers(type: string, payload: CellDTO[] | UpdateEnemy): Promise<void> {
    await this.board.notifyPlayers(validateGameMessageOutput({ type, payload }));
  }
}
