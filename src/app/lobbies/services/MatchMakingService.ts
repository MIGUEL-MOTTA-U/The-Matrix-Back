import type { MatchDTO, MatchDetails } from '../../../schemas/zod.js';

interface MatchMakingService {
  searchMatch: (match: MatchDetails) => Promise<void>;
  keepPlaying: (match: MatchDetails, userId: string) => Promise<void>;
  joinMatch: (matchId: MatchDetails, guestId: string) => Promise<MatchDTO>;
}
export default MatchMakingService;
