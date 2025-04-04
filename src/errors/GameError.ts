import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  MATCH_NOT_FOUND: 404,
  MATCH_NOT_STARTED: 400,
  MATCH_CANNOT_START: 400,
  USER_NOT_FOUND: 404,
  MATCH_WON: 400,
  USER_NOT_IN_MATCH: 400,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The requested match was not found': 'MATCH_NOT_FOUND',
  'The match has not started yet': 'MATCH_NOT_STARTED',
  'The match cannot start': 'MATCH_NOT_STARTED',
  'The requested user was not found': 'MATCH_NOT_FOUND',
  'The match was won': 'MATCH_WON',
  'The user is not in the match': 'USER_NOT_IN_MATCH',
};

export default class GameError extends ErrorTemplate {
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  public static readonly MATCH_NOT_STARTED = 'The match has not started yet';
  public static readonly MATCH_CANNOT_START = 'The match cannot start';
  public static readonly USER_NOT_FOUND = 'The requested user was not found';
  public static readonly MATCH_WON = 'The match was won';
  public static readonly USER_NOT_IN_MATCH = 'The user is not in the match';

  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
