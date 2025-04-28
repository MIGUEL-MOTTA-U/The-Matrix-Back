import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  BAD_WEB_SOCKET_REQUEST: 400,
  MATCH_NOT_FOUND: 404,
  MATCHMAKING_NOT_INITIALIZED: 500,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The provided WebSocket request is invalid': 'BAD_WEB_SOCKET_REQUEST',
  'The requested match was not found': 'MATCH_NOT_FOUND',
  'The matchmaking service is not initialized': 'MATCHMAKING_NOT_INITIALIZED',
};
export default class WebSocketError extends ErrorTemplate {
  public static readonly BAD_WEB_SOCKET_REQUEST = 'The provided WebSocket request is invalid';
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  public static readonly MATCHMAKING_SERVICE_NOT_INITIALIZED =
    'The matchmaking service is not initialized';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
