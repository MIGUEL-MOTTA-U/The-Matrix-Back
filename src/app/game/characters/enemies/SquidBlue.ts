import type { CellDTO, Direction } from '../../../../schemas/zod.js';
import Enemy from './Enemy.js';

export default class SquidBlue extends Enemy {
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
    } catch (_error) {}
  }

  public async execPower(direction: Direction): Promise<CellDTO[]> {
    return await this.mutex.runExclusive(() => {
      return this.cell.unfreezeFrontCells(direction, true);
    });
  }
}
