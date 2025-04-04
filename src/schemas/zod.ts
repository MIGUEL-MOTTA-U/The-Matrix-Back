import type { BoardItem } from '../app/game/match/boards/BoardItem.js';
import * as objects from './schemas.js';
const validateMatchInputDTO = (data: unknown): MatchInputDTO => {
  const schema = objects.matchInputDTOSchema;
  return schema.parse(data);
};

const validateString = (data: unknown): string => {
  const schema = objects.stringSchema;
  return schema.parse(data);
};

const validateMatchDetails = (data: unknown): MatchDetails => {
  const schema = objects.matchDetailsSchema;
  return schema.parse(data);
};

const validateUserQueue = (data: unknown): UserQueue => {
  const schema = objects.userQueueSchema;
  return schema.parse(data);
};
const validateGameMessageOutput = (data: unknown): GameMessageOutput => {
  const schema = objects.gameMessageOutputSchema;
  return schema.parse(data);
};

const validatePlayerState = (data: unknown): PlayerState => {
  const schema = objects.playerStateSchema;
  return schema.parse(data);
};

const validateEndMatch = (data: unknown): EndMatch => {
  const schema = objects.EndMatchSchema;
  return schema.parse(data);
};

const validateUpdateEnemy = (data: unknown): UpdateEnemy => {
  const schema = objects.updateEnemySchema;
  return schema.parse(data);
};

const validatePlayerMove = (data: unknown): PlayerMove => {
  const schema = objects.playerMoveSchema;
  return schema.parse(data);
};

const validateUpdateTime = (data: unknown): UpdateTime => {
  const schema = objects.updateTimeSchema;
  return schema.parse(data);
};

const validateErrorMatch = (data: unknown): ErrorMatch => {
  const schema = objects.errorMatchSchema;
  return schema.parse(data);
};

const validateUpdateAll = (data: unknown): UpdateAll => {
  const schema = objects.updateAllSchema;
  return schema.parse(data);
};

const validateBoardItemDTO = (data: unknown): BoardItemDTO => {
  const schema = objects.boardItemSchema;
  return schema.parse(data);
};

const validateCoordinates = (data: unknown): CellCoordinates => {
  const schema = objects.cellCordinatesSchema;
  return schema.parse(data);
};

const validateCellDTO = (data: unknown): CellDTO => {
  const schema = objects.cellDTOSchema;
  return schema.parse(data);
};

const validateGameMesssageInput = (data: unknown): GameMessageInput => {
  const schema = objects.gameMessageInputSchema;
  return schema.parse(data);
};

interface MatchInputDTO {
  level: number;
  map: string;
}
interface MatchDetails {
  id: string;
  host: string;
  guest?: string | null;
  level: number;
  map: string;
  started?: boolean;
}
interface BoardDTO {
  host: string | null;
  guest: string | null;
  fruitType: string;
  fruitsType: string[];
  enemies: number;
  enemiesCoordinates: number[][];
  fruitsCoordinates: number[][];
  fruits: number;
  playersStartCoordinates: number[][];
  board: CellDTO[];
}
interface CellDTO {
  x: number;
  y: number;
  item: BoardItemDTO | null;
  character: BoardItemDTO | null;
}
interface BoardItemDTO {
  type: string;
  id?: string;
  orientation?: string;
  color?: string;
}
interface CellCoordinates {
  x: number;
  y: number;
}
interface MatchDTO {
  id: string;
  level: number;
  map: string;
  host: string;
  guest: string;
  board: BoardDTO;
}
interface GameMessageOutput {
  type:
    | 'update-state'
    | 'end'
    | 'update-enemy'
    | 'update-move'
    | 'update-time'
    | 'error'
    | 'update-all';
  payload: PlayerMove | EndMatch | UpdateEnemy | UpdateTime | ErrorMatch | UpdateAll;
}
interface GameMessageInput {
  type: 'movement' | 'exec-power' | 'rotate' | 'set-color';
  payload: 'up' | 'down' | 'left' | 'right' | string;
}
interface PlayerState {
  id: string;
  state: 'dead' | 'alive';
  color?: string;
}
interface EndMatch {
  result: 'win' | 'lose';
}
interface UpdateEnemy {
  enemyId: string;
  coordinates: CellCoordinates;
  direction: 'up' | 'down' | 'left' | 'right';
}
interface PlayerMove {
  id: string;
  coordinates: CellCoordinates;
  direction: 'up' | 'down' | 'left' | 'right';
  state: 'alive' | 'dead';
  idItemConsumed?: string;
}
interface UpdateTime {
  minutesLeft: number;
  secondsLeft: number;
}
interface ErrorMatch {
  error: string;
}
interface UpdateAll {
  players: PlayerState[];
  board: CellDTO[];
  time: UpdateTime;
}

interface UserQueue {
  id: string;
  matchId: string;
}

export type {
  MatchInputDTO,
  MatchDetails,
  BoardDTO,
  CellDTO,
  BoardItem,
  BoardItemDTO,
  CellCoordinates,
  MatchDTO,
  GameMessageOutput,
  GameMessageInput,
  UserQueue,
  PlayerState,
  EndMatch,
  UpdateEnemy,
  PlayerMove,
  UpdateTime,
  ErrorMatch,
  UpdateAll,
};
export {
  validateString,
  validateMatchInputDTO,
  validateCoordinates,
  validateCellDTO,
  validateMatchDetails,
  validateGameMessageOutput,
  validateGameMesssageInput,
  validateUserQueue,
  validatePlayerState,
  validateEndMatch,
  validateUpdateEnemy,
  validatePlayerMove,
  validateUpdateTime,
  validateErrorMatch,
  validateUpdateAll,
  validateBoardItemDTO,
};
