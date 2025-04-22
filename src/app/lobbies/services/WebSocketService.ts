import type { WebSocket } from 'ws';
import type { MatchDetails } from '../../../schemas/zod.js';
import type Match from '../../game/match/Match.js';

export default interface WebSocketService {
  registerConnection: (userId: string, socket: WebSocket) => void;
  removeConnection: (userId: string) => void;
  matchMaking: (match: MatchDetails) => Promise<void>;
  notifyMatchFound: (match: Match, ghostMatchId: string) => Promise<void>;
}
