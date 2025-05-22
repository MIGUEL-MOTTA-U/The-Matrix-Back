import { type BoardItemDTO, validateBoardItemDTO } from '../../../../schemas/zod.js';
import { BoardItem } from './BoardItem.js';
/**
 * @class Rock
 *
 * The responsibility of this class is to represent
 * the behaviour and properties of a rock in the game.
 * @since 24/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class Rock extends BoardItem {
  /**
   * Block movement of the character.
   *
   * @returns {boolean} true, as rocks block movement.
   */
  blocked(): boolean {
    return true;
  }

  /**
   * Indicates that the rock cannot be picked.
   *
   * @returns {Promise<string | undefined>} A promise that resolves to undefined, as rocks cannot be picked.
   */
  public async pick(): Promise<string | undefined> {
    return undefined;
  }

  /**
   * Return DTO of the rock.
   *
   * @returns {BoardItemDTO} An object representing the rock.
   */
  getDTO(): BoardItemDTO {
    return validateBoardItemDTO({
      type: 'rock',
      id: this.id,
    });
  }
}
