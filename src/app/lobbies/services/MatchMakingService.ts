import type { MatchDTO, MatchDetails } from '../../../schemas/zod.js';

interface MatchMakingService {
  searchMatch: (match: MatchDetails) => Promise<void>;
  joinMatch: (matchId: MatchDetails, guestId: string) => Promise<MatchDTO>;
}
export default MatchMakingService;
