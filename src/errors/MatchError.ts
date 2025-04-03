import ErrorTemplate from './ErrorTemplate.js';

const errors = {
  MATCH_NOT_FOUND: 404,
  MATCH_CANNOT_BE_CREATED: 409,
  PLAYER_NOT_FOUND: 404,
  INVALID_MESSAGE_TYPE: 400,
  INVALID_MOVE: 400,
  WIN: 202,
  PLAYER_ALREADY_IN_MATCH: 409,
  MATCH_ALREADY_STARTED: 409,
  SOCKET_CLOSED: 499,
  INVALID_ROTATION: 400,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The requested match was not found': 'MATCH_NOT_FOUND',
  'The match cannot be created': 'MATCH_CANNOT_BE_CREATED',
  'The requested player was not found': 'PLAYER_NOT_FOUND',
  'The message type is invalid': 'INVALID_MESSAGE_TYPE',
  'The move is invalid': 'INVALID_MOVE',
  'The players won the match': 'WIN',
  'The player is already in a match': 'PLAYER_ALREADY_IN_MATCH',
  'The match has already started': 'MATCH_ALREADY_STARTED',
  'The socket was closed': 'SOCKET_CLOSED',
  'The rotation is invalid': 'INVALID_ROTATION',
};

export default class MatchError extends ErrorTemplate {
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  public static readonly SOCKET_CLOSED = 'The socket was closed';
  public static readonly MATCH_CANNOT_BE_CREATED = 'The match cannot be created';
  public static readonly PLAYER_NOT_FOUND = 'The requested player was not found';
  public static readonly INVALID_MESSAGE_TYPE = 'The message type is invalid';
  public static readonly INVALID_MOVE = 'The move is invalid';
  public static readonly WIN = 'The players won the match';
  public static readonly PLAYER_ALREADY_IN_MATCH = 'The player is already in a match';
  public static readonly MATCH_ALREADY_STARTED = 'The match has already started';
  public static readonly INVALID_ROTATION = 'The rotation is invalid';

  constructor(message: string) {
    const errorKey = messageToErrorKey[message];
    const errorCode = errors[errorKey];
    super(message, errorCode);
  }
}
