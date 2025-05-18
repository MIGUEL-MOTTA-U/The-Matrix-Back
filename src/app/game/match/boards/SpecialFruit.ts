import type { BoardItemDTO } from 'src/schemas/zod.js';
import Fruit from './Fruit.js';

export default class SpecialFruit extends Fruit {
  getDTO(): BoardItemDTO {
    return { type: 'specialfruit', id: this.id };
  }

  async pick(): Promise<string> {
    await this.board.removeFruit(this.cell.getCoordinates());
    const playerState = this.board.revivePlayers();
    if (playerState) {
      await this.board.notifyPlayers({
        type: 'update-state',
        payload: playerState,
      });
    }
    return this.id;
  }
}
