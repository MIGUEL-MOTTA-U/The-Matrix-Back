import type MatchRepository from '../../../schemas/MatchRepository.js';
import type UserRepository from '../../../schemas/UserRepository.js';
import { type MatchDetails, type UserQueue, validateUserQueue } from '../../../schemas/zod.js';
import { logger } from '../../../server.js';
import AsyncQueue from '../../../utils/AsyncQueue.js';
import type AsyncQueueInterface from '../../../utils/AsyncQueueInterface.js';
import type Match from '../../game/match/Match.js';
import type GameService from '../../game/services/GameService.js';
import type MatchMakingService from '../../lobbies/services/MatchMakingService.js';
import type WebSocketService from './WebSocketService.js';
/**
 * @class MatchMaking
 * This class is responsible for managing the matchmaking process.
 * It uses a thread-safety queue to manage users looking for a match.
 * @see {@link MatchMakingService}
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
class MatchMaking implements MatchMakingService {
  private readonly matchRepository: MatchRepository;
  private readonly userRepository: UserRepository;
  private readonly webSocketService: WebSocketService;
  private readonly queue: AsyncQueueInterface<UserQueue>;
  private readonly gameService: GameService;

  // Singleton instance
  constructor(
    matchRepository: MatchRepository,
    userRepository: UserRepository,
    webSocketService: WebSocketService,
    gameService: GameService
  ) {
    this.matchRepository = matchRepository;
    this.userRepository = userRepository;
    this.queue = new AsyncQueue<UserQueue>();
    this.gameService = gameService;
    this.webSocketService = webSocketService;
  }

  /**
   * This method is used to search for a match with the given match details.
   * @param matchDetails The match details to find matchmaking
   */
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

  public cancelMatchMaking(_userId: string): void {
    throw new Error('Method not implemented.');
  }

  private async updateMatch(matchId: string, host: string, guest: string): Promise<void> {
    this.matchRepository.updateMatch(matchId, { guest, host });
    this.matchRepository.extendSession(matchId, 10);
  }

  private async updateUser(userId: string, matchId: string): Promise<void> {
    this.userRepository.updateUser(userId, { matchId });
    this.userRepository.extendSession(userId, 10);
  }
  private async createMatch(match: MatchDetails): Promise<Match> {
    return this.gameService.createMatch(match);
  }
}
export default MatchMaking;
