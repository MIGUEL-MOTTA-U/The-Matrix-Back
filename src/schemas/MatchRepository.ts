import type { MatchDetails } from './zod.js';
/**
 * @interface MatchRepository
 * Defines the contract for a match repository.
 * This interface outlines the methods that must be implemented by any class that interacts with match data.
 * @since 18/04/2025
 * @author
 * Santiago Avellaneda, Andres Serrato, and Miguel Motta
 */
export default interface MatchRepository {
  /**
   * Retrieves a match by its ID.
   *
   * @param {string} matchId - The ID of the match to retrieve.
   * @return {Promise<MatchDetails>} A promise that resolves to the match object.
   */
  getMatchById(matchId: string): Promise<MatchDetails>;

  /**
   * Extend the session for the match with the given ID.
   *
   * @param {string} matchId - The ID of the match to extend the session for.
   * @param {number} duration - The duration in minutes to extend the session for.
   */
  extendSession(matchId: string, duration: number): Promise<void>;

  /**
   * Deletes the match with the given ID.
   *
   * @param matchId - The ID of the match to remove.
   */
  removeMatch(matchId: string): Promise<void>;

  /**
   * Updates the match with the given ID.
   *
   * @param {string} matchId - The ID of the match to update.
   * @param {Partial<MatchDetails>} matchData - The data to update in the match.
   * @return {Promise<void>} A promise that resolves when the update is complete.
   */
  updateMatch(matchId: string, matchData: Partial<MatchDetails>): Promise<void>;

  /**
   * Creates a new match.
   *
   * @param {MatchDetails} match - The match object to create.
   * @return {Promise<void>} A promise that resolves when the match is created.
   */
  createMatch(match: MatchDetails): Promise<void>;

  /**
   * Match exists
   *
   * @param {string} matchId - The ID of the match to check.
   * @return {Promise<boolean>} A promise that resolves to true if the match exists, false otherwise.
   */
  matchExists(matchId: string): Promise<boolean>;
}
