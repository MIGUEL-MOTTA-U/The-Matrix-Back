import type { MatchDetails } from '../../../schemas/zod.js';

interface MatchMakingService {
  searchMatch: (match: MatchDetails) => Promise<void>;
}
export default MatchMakingService;
