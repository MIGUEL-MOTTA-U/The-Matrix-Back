import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  BAD_WEB_SOCKET_REQUEST: 400,
  MATCH_NOT_FOUND: 404,
  MATCHMAKING_NOT_INITIALIZED: 500,
  MATCH_ALREADY_STARTED: 409,
  PLAYER_ALREADY_IN_MATCH: 409,
  PLAYER_NOT_CONNECTED: 409,
  MATCH_ALREADY_BEEN_HOSTED: 409,
  PLAYER_ALREADY_IN_MATCHMAKING: 409,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The provided WebSocket request is invalid': 'BAD_WEB_SOCKET_REQUEST',
  'The requested match was not found': 'MATCH_NOT_FOUND',
  'The matchmaking service is not initialized': 'MATCHMAKING_NOT_INITIALIZED',
  'The match has already started': 'MATCH_ALREADY_STARTED',
  'The player is already in a match': 'PLAYER_ALREADY_IN_MATCH',
  'The player is not connected': 'PLAYER_NOT_CONNECTED',
  'The match has already been published': 'MATCH_ALREADY_BEEN_HOSTED',
  'The player is already in matchmaking': 'PLAYER_ALREADY_IN_MATCHMAKING',
};
export default class WebSocketError extends ErrorTemplate {
  public static readonly BAD_WEB_SOCKET_REQUEST = 'The provided WebSocket request is invalid';
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  public static readonly MATCHMAKING_SERVICE_NOT_INITIALIZED =
    'The matchmaking service is not initialized';
  public static readonly MATCH_ALREADY_STARTED = 'The match has already started';
  public static readonly PLAYER_ALREADY_IN_MATCH = 'The player is already in a match';
  public static readonly PLAYER_NOT_CONNECTED = 'The player is not connected';
  public static readonly MATCH_ALREADY_BEEN_HOSTED = 'The match has already been published';
  public static readonly PLAYER_ALREADY_IN_MATCHMAKING = 'The player is already in matchmaking';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
