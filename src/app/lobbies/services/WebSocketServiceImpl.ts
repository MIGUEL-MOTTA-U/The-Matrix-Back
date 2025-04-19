import type { WebSocket } from 'ws';
import type { MatchDetails } from '../../../schemas/zod.js';
import { logger, redis } from '../../../server.js';
import type Match from '../../game/match/Match.js';
import type MatchMakingService from './MatchMakingService.js';
import MatchMaking from './MatchmakingImpl.js';

/**
 * @class WebsocketService
 * This class is responsible for managing WebSocket connections and matchmaking.
 * It provides methods to register and remove connections, as well as to handle matchmaking requests.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class WebsocketService {
  private static instance: WebsocketService;
  private connections: Map<string, WebSocket>;
  private matchMakingService: MatchMakingService;

  /**
   * This method is used to get the singleton instance of the WebsocketService class.
   *
   * @return {WebsocketService} Singleton instance of WebsocketService.
   */
  public static getInstance(): WebsocketService {
    if (!WebsocketService.instance) WebsocketService.instance = new WebsocketService();
    return WebsocketService.instance;
  }

  /**
   * Creates a new instance of WebsocketService.
   * Initializes the connections map and the matchmaking service.
   */
  private constructor() {
    this.connections = new Map(); // --> This should be a database (Redis)
    this.matchMakingService = MatchMaking.getInstance(this);
  }

  /**
   * This method is used to register a new WebSocket connection for a user.
   *
   * @param {string} userId The ID of the user to register.
   * @param {WebSocket} socket The WebSocket connection to register.
   */
  public registerConnection(userId: string, socket: WebSocket): void {
    this.connections.set(userId, socket);
  }

  /**
   * This method removes the WebSocket connection for a user by the given ID.
   *
   * @param {string} userId The ID of the user to remove the connection for.
   */
  public removeConnection(userId: string): void {
    this.connections.delete(userId);
  }

  /**
   * This method sends the match details to the matchmaking service
   * to queue the request.
   *
   * @param {MatchDetails} match The match details to validate.
   * @return {Promise<void>} A promise that resolves when the matchmaking request is queued.
   */
  public async matchMaking(match: MatchDetails): Promise<void> {
    this.matchMakingService.searchMatch(match);
  }

  /**
   * This method is used to notify the players that a match has been found.
   *
   * @param {Match} match The Match to play the following game
   * @param {string }ghostMatch The match id from the guest player, that should
   * be deleted.
   * @returns {Promise<void>} A promise that resolves when the notification is sent
   */
  public async notifyMatchFound(match: Match, ghostMatch: string): Promise<void> {
    try {
      const hostSocket = this.connections.get(match.getHost());
      const guestSocket = this.connections.get(match.getGuest());
      if (hostSocket && guestSocket) {
        hostSocket.send(JSON.stringify({ message: 'match-found', match: match.getMatchDTO() }));
        guestSocket.send(JSON.stringify({ message: 'match-found', match: match.getMatchDTO() }));
        this.connections.get(match.getGuest())?.close();
        this.connections.get(match.getHost())?.close();
        this.removeConnection(match.getHost());
        this.removeConnection(match.getGuest());
        redis.hset(`matches:${match.getId()}`, 'started', 'true');
        redis.del(`matches:${ghostMatch}`);
      } else {
        // TODO --> implement reconnect logic // Priority 2 NOT MVP
        throw new Error('One of the players is not connected');
      }
    } catch (error) {
      logger.warn('An error occurred on web scoket controller...');
      logger.error(error);
    }
  }
}
