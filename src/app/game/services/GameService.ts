import type { WebSocket } from 'ws';
import type {
  MatchDetails,
  PlayerMove,
  UpdateAll,
  UpdateEnemy,
  UpdateTime,
} from '../../../schemas/zod.js';
import type Match from '../match/Match.js';

export default interface GameService {
  startMatch(matchId: string): Promise<void>;
  createMatch(match: MatchDetails): Promise<Match>;
  registerConnection(user: string, socket: WebSocket): boolean;
  removeConnection(user: string): void;
  handleGameMessage(user: string, matchId: string, message: Buffer): Promise<void>;
  getMatch(matchId: string): Match | undefined;
  checkMatchDetails(matchDetails: MatchDetails): void;
  getMatchUpdate(matchId: string): UpdateAll;
  extendUsersSession(userId: string): Promise<void>;
  extendMatchSession(matchId: string): Promise<void>;
  updateTimeMatch(matchId: string, time: UpdateTime): Promise<void>;
  updateEnemy(
    matchId: string,
    hostId: string,
    guestId: string,
    data: UpdateEnemy | PlayerMove
  ): Promise<void>;
}
