import type { MatchStorage } from '../zod.js';
/**
 * @interface GameCache
 * Interface for a game cache that handles match storage and retrieval.
 *
 * @since 07/05/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default interface GameCache {
  saveMatch: (matchId: string, matchStorage: MatchStorage) => Promise<void>;
  getMatch: (matchId: string) => Promise<MatchStorage | null>;
  removeMatch: (matchId: string) => Promise<void>;
}
