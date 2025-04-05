import type AsyncQueueInterface from 'src/utils/AsyncQueueInterface.js';
import { type MatchDetails, type UserQueue, validateUserQueue } from '../../../schemas/zod.js';
import { logger, redis } from '../../../server.js';
import AsyncQueue from '../../../utils/AsyncQueue.js';
import type WebSocketService from '../../WebSocketServiceImpl.js';
import type Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import GameServiceImpl from '../../game/services/GameServiceImpl.js';
import type MatchMakingInterface from '../../lobbies/services/MatchMakingService.js';
class MatchMaking implements MatchMakingInterface {
  private queue: AsyncQueueInterface<UserQueue>;
  private gameService: GameService;
  private webSocketService: WebSocketService;

  // Singleton instance
  private static instance: MatchMaking;
  private constructor(webSocketService: WebSocketService) {
    this.queue = new AsyncQueue<UserQueue>();
    this.gameService = GameServiceImpl.getInstance(); // Manual dependency injection
    this.webSocketService = webSocketService;
  }
  public static getInstance(webSocketService: WebSocketService): MatchMaking {
    if (!MatchMaking.instance) MatchMaking.instance = new MatchMaking(webSocketService);
    return MatchMaking.instance;
  }

  // TODO -- Priority 3 --> Implement logic of different matches types (difficulties, maps, etc)
  public async searchMatch(matchDetails: MatchDetails): Promise<void> {
    const host = await this.queue.dequeue();
    const guest = matchDetails.host;
    if (host !== undefined && host.id !== guest) {
      const { id: hostId, matchId } = validateUserQueue(host);
      logger.info(`Match found for guest:${guest} host: ${hostId}`);
      const ghostMatch = matchDetails.id;

      matchDetails.host = hostId;
      matchDetails.guest = guest;
      matchDetails.id = matchId;

      this.updateUser(hostId, matchId);
      this.updateMatch(matchId, hostId, guest);

      const match = await this.createMatch(matchDetails);
      this.webSocketService.notifyMatchFound(match, ghostMatch);
    } else {
      logger.info(
        `Match not found for ${guest} so it was enqueued for match: ${JSON.stringify(matchDetails)}`
      );
      this.queue.enqueue({ id: guest, matchId: matchDetails.id });
    }
  }

  private async updateMatch(matchId: string, host: string, guest: string): Promise<void> {
    redis.hset(`matches:${matchId}`, 'guest', guest, 'host', host);
    redis.expire(`matches:${matchId}`, 10 * 60);
  }

  private async updateUser(userId: string, matchId: string): Promise<void> {
    redis.hset(`users:${userId}`, 'match', matchId);
    redis.expire(`users:${userId}`, 10 * 60);
  }

  public cancelMatchMaking(_userId: string): void {
    throw new Error('Method not implemented.');
  }

  private async createMatch(match: MatchDetails): Promise<Match> {
    return this.gameService.createMatch(match);
  }
}
export default MatchMaking;
