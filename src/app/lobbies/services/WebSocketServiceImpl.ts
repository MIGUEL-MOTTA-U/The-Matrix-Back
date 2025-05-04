import { WebSocket } from 'ws';
import WebSocketError from '../../../errors/WebSocketError.js';
import type MatchRepository from '../../../schemas/MatchRepository.js';
import type { MatchDetails } from '../../../schemas/zod.js';
import { logger } from '../../../server.js';
import type Match from '../../game/match/Match.js';
import type MatchMakingService from './MatchMakingService.js';
import type WebsocketService from './WebSocketService.js';

/**
 * @class WebsocketService
 * This class is responsible for managing WebSocket connections and matchmaking.
 * It provides methods to register and remove connections, as well as to handle matchmaking requests.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class WebsocketServiceImpl implements WebsocketService {
  private readonly matchRepository: MatchRepository;
  private readonly connections: Map<string, WebSocket>;
  private readonly matchesHosted: Map<string, WebSocket>;
  private matchMakingService?: MatchMakingService;

  /**
   * Creates a new instance of WebsocketService.
   * Initializes the connections map and the matchmaking service.
   */
  constructor(matchRepository: MatchRepository) {
    this.matchRepository = matchRepository;
    this.connections = new Map();
    this.matchesHosted = new Map();
  }

  /**
   * This method is used to set the matchmaking service.
   *
   * @param {MatchMakingService} matchMakingService The matchmaking service to set.
   */
  public setMatchMakingService(matchMakingService: MatchMakingService): void {
    this.matchMakingService = matchMakingService;
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
    if (!this.matchMakingService) {
      throw new WebSocketError(WebSocketError.MATCHMAKING_SERVICE_NOT_INITIALIZED);
    }
    this.matchMakingService.searchMatch(match);
  }

  /**
   * This method is used to notify the players that a match has been found.
   *
   * @param {Match} match The Match to play the following game
   * be deleted.
   * @returns {Promise<void>} A promise that resolves when the notification is sent
   */
  public async notifyMatchFound(match: Match): Promise<void> {
    try {
      const hostSocket = this.connections.get(match.getHost());
      const guestSocket = this.connections.get(match.getGuest());
      if (!(hostSocket && guestSocket))
        throw new WebSocketError(WebSocketError.PLAYER_NOT_CONNECTED);
      const message = { message: 'match-found', match: match.getMatchDTO() };
      hostSocket.send(JSON.stringify(message));
      guestSocket.send(JSON.stringify(message));
      this.connections.get(match.getGuest())?.close();
      this.connections.get(match.getHost())?.close();
      this.removeConnection(match.getHost());
      this.removeConnection(match.getGuest());
      this.matchRepository.updateMatch(match.getId(), {
        started: true,
      });
    } catch (error) {
      logger.warn('An error occurred on Web Socket Service While trying to notify match...');
      logger.error(error);
    }
  }

  /**
   * This method is used to validate if a match can be joined by a guest.
   *
   * @param {string} matchId The ID of the match to validate.
   * @param {string} guestId The ID of the guest player.
   * @returns {Promise<void>} A promise that resolves when the validation is complete.
   */
  public async validateMatchToJoin(matchId: string, guestId: string): Promise<void> {
    const match = await this.matchRepository.getMatchById(matchId);
    const hostWebSocket = this.matchesHosted.get(match.id);
    if (match.guest !== null) {
      throw new WebSocketError(WebSocketError.MATCH_ALREADY_STARTED);
    }
    if (match.host === guestId) {
      throw new WebSocketError(WebSocketError.PLAYER_ALREADY_IN_MATCH);
    }
    if (match.started) throw new WebSocketError(WebSocketError.MATCH_ALREADY_STARTED);
    if (hostWebSocket === undefined || hostWebSocket.readyState !== WebSocket.OPEN) {
      throw new WebSocketError(WebSocketError.PLAYER_NOT_CONNECTED);
    }
  }

  /**
   * This method is used to validate the match to publish in hosting...
   *
   * @param {string} matchId The ID of the match to validate.
   * @param {string} hostId The ID of the host player.
   * @returns {Promise<void>} A promise that resolves when the validation is complete.
   */
  public async validateMatchToPublish(matchId: string, hostId: string): Promise<void> {
    if (this.matchesHosted.has(matchId)) {
      throw new WebSocketError(WebSocketError.MATCH_ALREADY_BEEN_HOSTED);
    }
    if (this.connections.has(hostId)) {
      throw new WebSocketError(WebSocketError.PLAYER_ALREADY_IN_MATCHMAKING);
    }

    const match = await this.matchRepository.getMatchById(matchId);

    if (match.host !== hostId) {
      throw new WebSocketError(WebSocketError.PLAYER_NOT_CONNECTED);
    }
    if (match.guest || match.started) {
      throw new WebSocketError(WebSocketError.MATCH_ALREADY_STARTED);
    }
  }

  /**
   * This method is used to join a match published by a host.
   *
   * @param {MatchDetails} matchDetails The match details to join.
   * @param {string} guestId The ID of the guest player.
   */
  public async joinGame(
    matchDetails: MatchDetails,
    guestId: string,
    guestSocket: WebSocket
  ): Promise<void> {
    const hostSocket = this.matchesHosted.get(matchDetails.id);
    if (
      hostSocket === undefined ||
      hostSocket.readyState !== WebSocket.OPEN ||
      guestSocket.readyState !== WebSocket.OPEN
    ) {
      throw new WebSocketError(WebSocketError.PLAYER_NOT_CONNECTED);
    }
    if (!this.matchMakingService) {
      throw new WebSocketError(WebSocketError.MATCHMAKING_SERVICE_NOT_INITIALIZED);
    }
    const matchDTO = await this.matchMakingService.joinMatch(matchDetails, guestId);
    this.matchRepository.updateMatch(matchDetails.id, {
      guest: guestId,
      started: true,
    });
    hostSocket.send(JSON.stringify({ message: 'match-found', match: matchDTO }));
    guestSocket.send(JSON.stringify({ message: 'match-found', match: matchDTO }));
    hostSocket.close();
    guestSocket.close();
  }

  /**
   * This method is used to publish a match to be published for hosting.
   *
   * @param {string} matchId The match details to publish.
   * @param {WebSocket} socket The WebSocket connection to publish the match.
   * @returns {void}
   */
  public publishMatch(matchId: string, socket: WebSocket): void {
    this.matchesHosted.set(matchId, socket);
  }

  /**
   * This method is used to remove a published match from the hosted matches.
   * @param {string} matchId The ID of the match to remove.
   * @returns {void}
   */
  public removePublishedMatch(matchId: string): void {
    this.matchesHosted.delete(matchId);
  }
}
