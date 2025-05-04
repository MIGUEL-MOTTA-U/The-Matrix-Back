import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  USER_NOT_DEFINED: 400,
  FREEZE_DIRECTION_ERROR: 400,
};
const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The user is not defined': 'USER_NOT_DEFINED',
  'Not supported direction for freeze': 'FREEZE_DIRECTION_ERROR',
};
export default class BoardError extends ErrorTemplate {
  public static readonly USER_NOT_DEFINED = 'The user is not defined';
  public static readonly FREEZE_DIRECTION_ERROR = 'Not supported direction for freeze';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
