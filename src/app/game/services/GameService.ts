import type { WebSocket } from 'ws';
import type {
  GameMessageOutput,
  MatchDetails,
  MatchStorage,
  UpdateAll,
  UpdateTime,
} from '../../../schemas/zod.js';
import type Match from '../match/Match.js';

export default interface GameService {
  startMatch(matchId: string): Promise<void>;
  createMatch(match: MatchDetails): Promise<Match>;
  registerConnection(user: string, socket: WebSocket): boolean;
  removeConnection(user: string): void;
  handleGameMessage(userId: string, matchId: string, message: Buffer): Promise<void>;
  getMatch(matchId: string): Promise<Match | undefined>;
  checkMatchDetails(matchDetails: MatchDetails): void;
  getMatchUpdate(matchId: string): Promise<UpdateAll>;
  extendUsersSession(userId: string): Promise<void>;
  extendMatchSession(matchId: string): Promise<void>;
  updateTimeMatch(matchId: string, time: UpdateTime): Promise<void>;
  updatePlayers(
    matchId: string,
    hostId: string,
    guestId: string,
    data: GameMessageOutput
  ): Promise<void>;
  saveMatch(matchId: string, matchStorage: MatchStorage): Promise<void>;
  getMatchStorage(matchId: string): Promise<MatchStorage | null>;
}
