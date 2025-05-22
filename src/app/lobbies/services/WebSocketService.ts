import type { WebSocket } from 'ws';
import type { MatchDetails } from '../../../schemas/zod.js';
import type Match from '../../game/match/Match.js';
import type MatchMakingService from './MatchMakingService.js';

export default interface WebSocketService {
  registerConnection: (userId: string, socket: WebSocket) => void;
  removeConnection: (userId: string) => void;
  matchMaking: (match: MatchDetails) => Promise<void>;
  keepPlaying: (match: MatchDetails, userId: string) => Promise<void>;
  isConnected: (userId: string) => boolean;
  notifyMatchFound: (match: Match) => Promise<void>;
  setMatchMakingService(matchMakingService: MatchMakingService): void;
  validateMatchToJoin: (matchId: string, guestId: string) => Promise<void>;
  joinGame: (matchDetails: MatchDetails, guestId: string, guestSocket: WebSocket) => Promise<void>;
  validateMatchToPublish: (matchId: string, hostId: string) => Promise<void>;
  publishMatch: (matchId: string, hostSocket: WebSocket) => void;
  removePublishedMatch: (matchId: string) => void;
  handleJoinGameMessage: (
    matchDetails: MatchDetails,
    guestId: string,
    message: Buffer
  ) => Promise<void>;
  handleMatchMessage: (
    matchDetails: MatchDetails,
    hostId: string,
    message: Buffer
  ) => Promise<void>;
}
