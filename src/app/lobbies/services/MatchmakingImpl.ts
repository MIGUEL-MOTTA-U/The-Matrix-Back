import type AsyncQueueInterface from 'src/utils/AsyncQueueInterface.js';
import type { MatchDetails } from '../../../schemas/zod.js';
import AsyncQueue from '../../../utils/AsyncQueue.js';
import type WebSocketService from '../../WebSocketServiceImpl.js';
import Player from '../../game/characters/Player.js';
import type Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import GameServiceImpl from '../../game/services/GameServiceImpl.js';
import type MatchMakingInterface from '../../lobbies/services/MatchMakingService.js';
class MatchMaking implements MatchMakingInterface {
  // Matchmaking queue
  private queue: AsyncQueueInterface<Player>;
  // Queue of matches (matches in progress) Should be shared between
  // Game service (the logic of the game)
  private gameService: GameService;
  private webSocketService: WebSocketService;

  // Singleton instance
  private static instance: MatchMaking;
  private constructor(webSocketService: WebSocketService) {
    this.queue = new AsyncQueue<Player>();
    this.gameService = GameServiceImpl.getInstance(); // Manual dependency injection
    this.webSocketService = webSocketService;
  }
  public static getInstance(webSocketService: WebSocketService): MatchMaking {
    if (!MatchMaking.instance) MatchMaking.instance = new MatchMaking(webSocketService);
    return MatchMaking.instance;
  }

  // TODO -- Priority 3 --> Implement logic of different matches types (difficulties, maps, etc)
  public async searchMatch(playerId: string, matchDetails: MatchDetails): Promise<void> {
    const player = await this.queue.dequeue(); // Esperamos a que la promesa de dequeue se resuelva

    if (player !== undefined) {
      console.info(`\nMatch found for ${playerId} and ${player.getId()}\n`);
      const match = this.createMatch(playerId, player.getId(), matchDetails);
      this.webSocketService.notifyMatchFound(match);
    } else {
      console.info(
        `Match not found for ${playerId} so it was enqueued for match: ${JSON.stringify(matchDetails)}`
      );
      this.queue.enqueue(new Player(playerId, null));
    }
  }

  public cancelMatchMaking(_userId: Player): void {
    throw new Error('Method not implemented.');
  }

  private createMatch(host: string, guest: string, match: MatchDetails): Match {
    return this.gameService.createMatch(host, guest, match);
  }
}
export default MatchMaking;
