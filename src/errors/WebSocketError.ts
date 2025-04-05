import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  BAD_WEB_SOCKET_REQUEST: 400,
  MATCH_NOT_FOUND: 404,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The provided WebSocket request is invalid': 'BAD_WEB_SOCKET_REQUEST',
  'The requested match was not found': 'MATCH_NOT_FOUND',
};
export default class WebSocketError extends ErrorTemplate {
  public static readonly BAD_WEB_SOCKET_REQUEST = 'The provided WebSocket request is invalid';
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
