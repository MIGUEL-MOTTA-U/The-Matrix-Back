import MatchError from '../../../errors/MatchError.js';
import type MatchRepository from '../../../schemas/MatchRepository.js';
import type UserRepository from '../../../schemas/UserRepository.js';
import {
  type CustomMapKey,
  type MatchDTO,
  type MatchDetails,
  type UserQueue,
  validateUserQueue,
} from '../../../schemas/zod.js';
import { logger } from '../../../server.js';
import AsyncQueue from '../../../utils/AsyncQueue.js';
import type AsyncQueueInterface from '../../../utils/AsyncQueueInterface.js';
import CustomQueuesMap from '../../../utils/CustomQueuesMap.js';
import type CustomUserQueueMapInterface from '../../../utils/CustomUserQueueMapInterface.js';
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
  private readonly queue: CustomUserQueueMapInterface<CustomMapKey, AsyncQueueInterface<UserQueue>>;
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
    this.queue = new CustomQueuesMap<CustomMapKey, AsyncQueueInterface<UserQueue>>();
    this.gameService = gameService;
    this.webSocketService = webSocketService;
  }

  /**
   * This method is used to search for a match with the given match details.
   * @param matchDetails The match details to find matchmaking
   */
  public async searchMatch(matchDetails: MatchDetails): Promise<void> {
    const key: CustomMapKey = { map: matchDetails.map, level: matchDetails.level };
    const queue = this.queue.get(key);
    if (queue === undefined) {
      const newQueue = new AsyncQueue<UserQueue>();
      await newQueue.enqueue({ id: matchDetails.host, matchId: matchDetails.id });
      this.queue.add(key, newQueue);
      logger.info(
        `No queue found for ${matchDetails.host} so it was enqueued for map: ${matchDetails.map} level: ${matchDetails.level}`
      );
      return;
    }
    const host = await queue.dequeue();
    const guest = matchDetails.host;

    if (host === undefined || host.id === guest) {
      logger.info(
        `Match not found for ${guest} so it was enqueued for match: ${JSON.stringify(matchDetails)}`
      );
      await queue.enqueue({ id: guest, matchId: matchDetails.id });
      return;
    }
    const { id: hostId, matchId } = validateUserQueue(host);
    if (!matchId) throw new MatchError(MatchError.MATCH_NOT_FOUND);
    logger.info(
      `Match found for guest:${guest} host: ${hostId} for map: ${matchDetails.map} level: ${matchDetails.level}`
    );
    const ghostMatch = matchDetails.id;
    matchDetails.host = hostId;
    matchDetails.guest = guest;
    matchDetails.id = matchId;
    const match = await this.createMatch(matchDetails);
    await this.updateUser(hostId, matchId);
    await this.updateMatch(matchId, hostId, guest);
    await this.webSocketService.notifyMatchFound(match);
    await this.matchRepository.removeMatch(ghostMatch);
  }

  /**
   * This method is used to keep playing a match.
   * @param {MatchDetails} match The match details to keep playing
   * @param {string} userId The user id to keep playing
   * @returns {Promise<void>} A promise that resolves when the keep playing process is complete
   */
  public async keepPlaying(match: MatchDetails, userId: string): Promise<void> {
    if (match.started) throw new MatchError(MatchError.MATCH_ALREADY_STARTED);
    const guest = match.guest;
    const host = match.host;
    if (guest === null || guest === undefined) throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    if (host !== userId && guest !== userId) throw new MatchError(MatchError.PLAYER_NOT_FOUND);
    if (this.webSocketService.isConnected(guest) && this.webSocketService.isConnected(host)) {
      // Ambos estan conectados
      logger.info(
        `Match found for guest:${guest} host: ${host} for map: ${match.map} level: ${match.level}`
      );
      const matchGame = await this.createMatch(match);
      await this.webSocketService.notifyMatchFound(matchGame);
    }
  }

  public async joinMatch(matchDetails: MatchDetails, guestId: string): Promise<MatchDTO> {
    matchDetails.guest = guestId;
    const match = await this.createMatch(matchDetails);
    await this.updateUser(guestId, matchDetails.id);
    await this.updateMatch(matchDetails.id, matchDetails.host, guestId);
    return match.getMatchDTO();
  }

  private async updateMatch(matchId: string, host: string, guest: string): Promise<void> {
    await this.matchRepository.updateMatch(matchId, { guest, host });
    await this.matchRepository.extendSession(matchId, 10);
  }

  private async updateUser(userId: string, matchId: string | null): Promise<void> {
    await this.userRepository.updateUser(userId, { matchId, role: 'GUEST' });
    await this.userRepository.extendSession(userId, 10);
  }
  private async createMatch(match: MatchDetails): Promise<Match> {
    return await this.gameService.createMatch(match);
  }
}
export default MatchMaking;
