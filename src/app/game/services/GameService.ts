import type { WebSocket } from 'ws';
import type { MatchDetails, UpdateAll } from '../../../schemas/zod.js';
import type Match from '../match/Match.js';

export default interface GameService {
  startMatch(matchId: string): Promise<void>;
  createMatch(match: MatchDetails): Match;
  registerConnection(user: string, socket: WebSocket): boolean;
  removeConnection(user: string): void;
  handleGameMessage(user: string, matchId: string, message: Buffer): Promise<void>;
  getMatch(matchId: string): Match | undefined;
  checkMatchDetails(matchDetails: MatchDetails): void;
  getMatchUpdate(matchId: string): UpdateAll;
  extendUsersSession(userId: string): Promise<void>;
  extendMatchSession(matchId: string): Promise<void>;
}
