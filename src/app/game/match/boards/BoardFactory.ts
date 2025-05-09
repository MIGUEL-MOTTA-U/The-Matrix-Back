import type { BoardStorage, PlayerStorage } from '../../../../schemas/zod.js';
import type Match from '../Match.js';
import type Board from './Board.js';
import Level1Board from './levels/Level1Board.js';
import Level2Board from './levels/Level2Board.js';
import Level3Board from './levels/Level3Board.js';
import Level4Board from './levels/Level4Board.js';
import Level5Board from './levels/Level5Board.js';
/**
 * @class BoardFactory
 *
 * Factory class responsible for creating the appropriate Board implementation
 * based on the map and difficulty level.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Allow static-only class for simplicity and following jsdoc conventions, it might be a normal function, but we are following the same pattern as the rest of the codebase.
class BoardFactory {
  /**
   * Creates a Board instance based on the provided level and map.
   *
   * @param match The match this board belongs to
   * @param map The map data
   * @param level The difficulty level
   * @returns A Board instance appropriate for the level and map
   */
  public static createBoard(match: Match, map: string, level: number): Board {
    let board: Board;
    switch (level) {
      case 1:
        board = new Level1Board(match, map, level);
        break;
      case 2:
        board = new Level2Board(match, map, level);
        break;
      case 3:
        board = new Level3Board(match, map, level);
        break;
      case 4:
        board = new Level4Board(match, map, level);
        break;
      case 5:
        board = new Level5Board(match, map, level);
        break;
      default:
        board = new Level1Board(match, map, level);
    }
    return board;
  }
}
export default BoardFactory;
