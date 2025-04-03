import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  MATCH_NOT_FOUND: 404,
  MATCH_NOT_STARTED: 400,
  MATCH_CANNOT_START: 400,
  USER_NOT_FOUND: 404,
};

const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The requested match was not found': 'MATCH_NOT_FOUND',
  'The match has not started yet': 'MATCH_NOT_STARTED',
  'The match cannot start': 'MATCH_NOT_STARTED',
  'The requested user was not found': 'MATCH_NOT_FOUND',
};

export default class GameError extends ErrorTemplate {
  public static readonly MATCH_NOT_FOUND = 'The requested match was not found';
  public static readonly MATCH_NOT_STARTED = 'The match has not started yet';
  public static readonly MATCH_CANNOT_START = 'The match cannot start';
  public static readonly USER_NOT_FOUND = 'The requested user was not found';
  static MATCH_WON: string;

  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
