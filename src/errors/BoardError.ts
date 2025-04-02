import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  USER_NOT_DEFINED: 400,
};
const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The requested match was not found': 'USER_NOT_DEFINED',
};
export default class BoardError extends ErrorTemplate {
  public static readonly USER_NOT_DEFINED = 'The user is not defined';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
