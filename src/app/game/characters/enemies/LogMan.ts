import {
  type CellCoordinates,
  type Direction,
  type EnemiesTypes,
  type PathResultWithDirection,
  validateGameMessageOutput,
  validatePathResultWithDirection,
} from '../../../../schemas/zod.js';
import Enemy from './Enemy.js';
/**
 * @class LogMan
 * @extends Enemy
 * Represents the behavior and properties of a LogMan enemy in the game.
 * The LogMan moves in a straight line towards the players and can break frozen cells.
 *
 * @since 7/05/2025
 * @author Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default class LogMan extends Enemy {
  public async calculateMovement(): Promise<void> {
    const canBreakFrozen = false;
    const { hostPath, guestPath } = this.board.getPlayersPaths(this.cell, canBreakFrozen);

    const bestPath = this.calculateBestStraightPath(hostPath, guestPath);
    if (bestPath) return await this.rollToDirection(bestPath.direction, bestPath.distance);
    await this.rollToDirection(this.orientation);
  }

  /*
   * Moves the LogMan in the specified direction for a given number of steps
   */
  private async rollToDirection(direction: Direction, times?: number): Promise<void> {
    let continueRolling = true;
    let count = 0;

    // Update orientation first to avoid unnecessary calculation in next movement
    this.orientation = direction;

    while (continueRolling && (times === undefined || count < times)) {
      try {
        await this.moveAlongPath(direction);
        this.enemyState = 'roling';
        const enemyDTO = this.getCharacterUpdate(null);
        await this.board.notifyPlayers(
          validateGameMessageOutput({ type: 'update-enemy', payload: enemyDTO })
        );
        count++;
      } catch (_error) {
        continueRolling = false;
        // Optional: Log error or handle specific obstacles
      }
    }
    this.enemyState = 'stopped';
  }

  /*
   * This method calculates the best path for the LogMan to follow in stright line.
   */
  private calculateBestStraightPath(
    hostPath: PathResultWithDirection | null,
    guestPath: PathResultWithDirection | null
  ): PathResultWithDirection | null {
    if (hostPath && guestPath) {
      const hostStrightPath = this.calculateCoordinatesStraightPath(hostPath);
      const guestStraightPath = this.calculateCoordinatesStraightPath(guestPath);
      const resultHostPath = validatePathResultWithDirection({
        distance: hostStrightPath.length,
        path: hostStrightPath,
        direction: hostPath.direction,
      });
      const resultGuestPath = validatePathResultWithDirection({
        distance: guestStraightPath.length,
        path: guestStraightPath,
        direction: guestPath.direction,
      });
      return hostStrightPath.length < guestStraightPath.length ? resultHostPath : resultGuestPath;
    }
    if (hostPath) {
      const hostStraightPath = this.calculateCoordinatesStraightPath(hostPath);
      return validatePathResultWithDirection({
        distance: hostStraightPath.length,
        path: hostStraightPath,
        direction: hostPath.direction,
      });
    }
    if (guestPath) {
      const guestStraightPath = this.calculateCoordinatesStraightPath(guestPath);
      return validatePathResultWithDirection({
        distance: guestStraightPath.length,
        path: guestStraightPath,
        direction: guestPath.direction,
      });
    }
    return null;
  }

  /*
   * This method calculates the coordinates of the path in a straight line.
   */
  private calculateCoordinatesStraightPath(
    pathDirection: PathResultWithDirection
  ): CellCoordinates[] {
    if (pathDirection.path.length === 0) return [];

    const coordinates: CellCoordinates[] = [];
    const direction = pathDirection.direction;

    coordinates.push(pathDirection.path[0]);

    const isVertical = direction === 'up' || direction === 'down';

    for (let i = 1; i < pathDirection.path.length; i++) {
      const prevCell = pathDirection.path[i - 1];
      const currentCell = pathDirection.path[i];

      if (
        (isVertical && prevCell.x === currentCell.x) ||
        (!isVertical && prevCell.y === currentCell.y)
      ) {
        coordinates.push(currentCell);
      } else {
        break;
      }
    }

    return coordinates;
  }
  /**
   * Retrieves the name of the Log Man enemy.
   * @returns {EnemiesTypes} The name of the enemy.
   */
  public getEnemyName(): EnemiesTypes {
    return 'log-man';
  }
}
