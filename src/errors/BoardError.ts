import ErrorTemplate from './ErrorTemplate.js';
const errors = {
  USER_NOT_DEFINED: 400,
  FREEZE_DIRECTION_ERROR: 400,
  INVALID_ITEM_TYPE: 400,
  FRUIT_TYPE_NOT_DEFINED: 400,
};
const messageToErrorKey: Record<string, keyof typeof errors> = {
  'The user is not defined': 'USER_NOT_DEFINED',
  'Not supported direction for freeze': 'FREEZE_DIRECTION_ERROR',
  'Invalid item type': 'INVALID_ITEM_TYPE',
  'Fruit type not defined': 'FRUIT_TYPE_NOT_DEFINED',
};
export default class BoardError extends ErrorTemplate {
  public static readonly USER_NOT_DEFINED = 'The user is not defined';
  public static readonly FREEZE_DIRECTION_ERROR = 'Not supported direction for freeze';
  public static readonly INVALID_ITEM_TYPE = 'Invalid item type';
  public static readonly FRUIT_TYPE_NOT_DEFINED = 'Fruit type not defined';
  constructor(message: string) {
    super(message, errors[messageToErrorKey[message]]);
  }
}
