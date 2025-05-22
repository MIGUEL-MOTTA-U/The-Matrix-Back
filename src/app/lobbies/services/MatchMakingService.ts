import type WebSocket from 'ws';
import type { MatchDTO, MatchDetails, UserQueue } from '../../../schemas/zod.js';

interface MatchMakingService {
  searchMatch: (match: MatchDetails) => Promise<void>;
  keepPlaying: (match: MatchDetails, userId: string) => Promise<void>;
  joinMatch: (matchId: MatchDetails, guestId: string) => Promise<MatchDTO>;
  updatePlayer(matchId: string, userId: string, userData: Partial<UserQueue>): Promise<void>;
  notifyPlayerUpdate: (
    host: WebSocket | undefined,
    guest: WebSocket | undefined,
    userData: Partial<UserQueue>
  ) => Promise<void>;
}
export default MatchMakingService;
