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

const validateUpdateFruits = (data: unknown): UpdateFruits => {
  const schema = objects.fruitsSchema;
  return schema.parse(data);
};

const validateInfo = (data: unknown): Info => {
  const schema = objects.infoSchema;
  return schema.parse(data);
};

const validateCustomMapKey = (data: unknown): CustomMapKey => {
  const schema = objects.customMapKeySchema;
  return schema.parse(data);
};

const validatePathResult = (data: unknown): PathResult => {
  const schema = objects.pathResultSchema;
  return schema.parse(data);
};

const validatePathResultWithDirection = (data: unknown): PathResultWithDirection => {
  const schema = objects.PathResultWithDirectionSchema;
  return schema.parse(data);
};

const parseCoordinatesToString = (coordinates: CellCoordinates): string => {
  return `${coordinates.x},${coordinates.y}`;
};

const parseStringToCoordinates = (coordinates: string): CellCoordinates => {
  const [x, y] = coordinates.split(',').map(Number);
  return { x, y };
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
  enemiesNumber: number;
  fruitsNumber: number;
  playersStartCoordinates: number[][];
  cells: CellDTO[];
}
interface CellDTO {
  coordinates: CellCoordinates;
  item: BoardItemDTO | null;
  character: BoardItemDTO | null;
  frozen: boolean;
}
interface BoardItemDTO {
  type: string;
  id: string;
  orientation?: string;
  color?: string;
}
interface Info {
  message: string;
}
interface CellCoordinates {
  x: number;
  y: number;
}
interface MatchDTO {
  id: string;
  level: number;
  map: string;
  hostId: string;
  guestId: string;
  board: BoardDTO;
  typeFruits: string[];
}
interface GameMessageOutput {
  type:
    | 'update-state'
    | 'end'
    | 'update-enemy'
    | 'update-move'
    | 'update-time'
    | 'error'
    | 'update-all'
    | 'update-fruits'
    | 'update-frozen-cells';
  payload:
    | PlayerMove
    | EndMatch
    | UpdateEnemy
    | UpdateTime
    | ErrorMatch
    | UpdateAll
    | UpdateFruits
    | PlayerState
    | FrozenCells;
}
interface GameMessageInput {
  type: 'movement' | 'exec-power' | 'rotate' | 'set-color';
  payload: Direction | string;
}
interface PlayerState {
  id: string;
  state: 'dead' | 'alive';
  color?: string;
}
interface EndMatch {
  result: 'win' | 'lose' | 'end game';
}
interface UpdateEnemy {
  enemyId: string;
  coordinates: CellCoordinates;
  direction: Direction;
}
interface PlayerMove {
  id: string;
  coordinates: CellCoordinates;
  direction: Direction;
  state: 'alive' | 'dead';
  idItemConsumed?: string;
  numberOfFruits?: number;
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
  cells: CellDTO[];
  time: UpdateTime;
}

interface UserQueue {
  role?: PlayerType;
  id: string;
  matchId: string | null;
  color?: string;
}

interface UpdateFruits {
  fruitType: string;
  fruitsNumber: number;
  cells: CellDTO[];
  currentRound: number;
  nextFruitType: string | null;
}

interface CustomMapKey {
  map: string;
  level: number;
}

interface PathResult {
  distance: number;
  path: CellCoordinates[];
}

interface PathResultWithDirection extends PathResult {
  direction: Direction;
}

interface FrozenCells {
  cells: CellDTO[];
  direction: Direction;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type PlayerType = 'HOST' | 'GUEST';
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
  UpdateFruits,
  Info,
  CustomMapKey,
  Direction,
  PathResult,
  PathResultWithDirection,
  PlayerType,
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
  validateUpdateFruits,
  validateInfo,
  validateCustomMapKey,
  validatePathResult,
  validatePathResultWithDirection,
  parseCoordinatesToString,
  parseStringToCoordinates,
};
