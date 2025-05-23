import { z } from 'zod';
const stringSchema = z.string().nonempty().min(1);
const infoSchema = z.object({
  message: stringSchema,
});
const playersTypeSchema = z.enum(['HOST', 'GUEST']);
const directionSchema = z.enum(['up', 'down', 'left', 'right']);
const matchInputDTOSchema = z.object({
  level: z.number().nonnegative(),
  map: z.string().nonempty(),
});
const enemiesTypesSchema = z.enum(['troll', 'cow', 'log-man', 'squid-blue', 'squid-green']);
const itemsTypesSchema = z.enum(['rock', 'fruit', 'specialfruit']);
const boardItemSchema = z.object({
  type: z.union([enemiesTypesSchema, itemsTypesSchema, z.enum(['player'])]),
  id: z.string(),
  orientation: directionSchema.optional(),
  color: z.string().optional(),
});
const cellCordinatesSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
});

const cellDTOSchema = z.object({
  coordinates: cellCordinatesSchema,
  item: boardItemSchema.nullable(),
  character: boardItemSchema.nullable(),
  frozen: z.boolean(),
});

const playerStateSchema = z.object({
  id: z.string().nonempty(),
  state: z.enum(['dead', 'alive']),
  color: z.string().optional(),
});

const fruitsSchema = z.object({
  fruitType: z.string().nonempty(),
  fruitsNumber: z.number().nonnegative(),
  cells: z.array(cellDTOSchema),
  currentRound: z.number().nonnegative(),
  nextFruitType: z.string().nullable(),
});

const EndMatchSchema = z.object({
  result: z.enum(['win', 'lose', 'end game']),
});

const enemyStateSchema = z.enum(['walking', 'roling', 'stopped']);

const updateEnemySchema = z.object({
  enemyId: z.string().nonempty(),
  coordinates: cellCordinatesSchema,
  direction: directionSchema,
  enemyState: enemyStateSchema,
});

const playerMoveSchema = z.object({
  id: z.string().nonempty(),
  coordinates: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
  }),
  direction: directionSchema,
  state: z.enum(['alive', 'dead']),
  idItemConsumed: z.string().optional(),
  numberOfFruits: z.number().optional(),
});

const updateTimeSchema = z.object({
  minutesLeft: z.number().nonnegative(),
  secondsLeft: z.number().nonnegative(),
});

const errorMatchSchema = z.object({
  error: z.string().nonempty(),
});

const updateAllSchema = z.object({
  players: z.array(playerStateSchema),
  cells: z.array(cellDTOSchema),
  time: updateTimeSchema,
});

const gameMessageInputSchema = z.object({
  type: z.enum([
    'movement',
    'exec-power',
    'rotate',
    'set-color',
    'pause',
    'resume',
    'update-all',
    'set-name',
    'set-state',
  ]),
  payload: z.union([directionSchema, z.string()]),
});

const updateFrozenCellsSchema = z.object({
  cells: z.array(cellDTOSchema),
  direction: directionSchema,
});
const partialUserQueueSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  matchId: z.string().optional(),
  color: z.string().optional(),
  role: playersTypeSchema.optional(),
  status: z.enum(['WAITING', 'PLAYING', 'READY']).optional(),
});

const gameMessageOutputSchema = z.object({
  type: z.enum([
    'update-state',
    'end',
    'update-enemy',
    'update-move',
    'update-time',
    'error',
    'update-all',
    'update-fruits',
    'update-frozen-cells',
    'paused',
    'update-special-fruit',
    'timeout',
    'player-update',
  ]),
  payload: z.union([
    playerStateSchema,
    EndMatchSchema,
    updateEnemySchema,
    playerMoveSchema,
    updateTimeSchema,
    errorMatchSchema,
    updateAllSchema,
    fruitsSchema,
    updateFrozenCellsSchema,
    z.boolean(),
    cellDTOSchema,
    infoSchema,
    partialUserQueueSchema,
  ]),
});

const matchDetailsSchema = z.object({
  id: z.string().nonempty(),
  host: z.string().nonempty(),
  guest: z.string().nullable(),
  level: z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = Number.parseInt(val, 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, z.number().nonnegative()),
  map: z.string().nonempty(),
  started: z.preprocess((val) => {
    if (typeof val === 'string') {
      const parsed = Boolean(val);
      return parsed;
    }
    return val;
  }, z.boolean().optional()),
});

const userQueueSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty().optional(),
  matchId: z.string().nonempty().nullable(),
  color: z.string().optional(),
  role: playersTypeSchema.optional(),
  status: z.enum(['WAITING', 'PLAYING', 'READY']),
});

const customMapKeySchema = z.object({
  map: z.string().nonempty(),
  level: z.number().nonnegative(),
});

const pathResultSchema = z.object({
  distance: z.number().nonnegative(),
  path: z.array(cellCordinatesSchema),
});

const PathResultWithDirectionSchema = pathResultSchema.extend({
  direction: directionSchema,
});

const PlayerStorageSchema = z.object({
  id: z.string().nonempty(),
  color: z.string(),
  coordinates: cellCordinatesSchema,
  direction: directionSchema,
  state: z.enum(['dead', 'alive']),
});

const BoardStorageSchema = z.object({
  fruitType: z.array(z.string()),
  fruitsContainer: z.array(z.string()),
  fruitsNumber: z.number().nonnegative(),
  fruitsRound: z.number().nonnegative(),
  currentRound: z.number().nonnegative(),
  currentFruitType: z.string(),
  rocksCoordinates: z.array(z.array(z.number())),
  fruitsCoordinates: z.array(z.array(z.number())),
  board: z.array(cellDTOSchema),
});

const MatchStorageSchema = z.object({
  id: z.string().nonempty(),
  level: z.number().nonnegative(),
  map: z.string().nonempty(),
  timeSeconds: z.number().nonnegative(),
  host: PlayerStorageSchema,
  guest: PlayerStorageSchema,
  board: BoardStorageSchema,
  fruitGenerated: z.boolean(),
  paused: z.boolean(),
});
export {
  stringSchema,
  matchInputDTOSchema,
  cellCordinatesSchema,
  matchDetailsSchema,
  cellDTOSchema,
  boardItemSchema,
  playerStateSchema,
  EndMatchSchema,
  updateEnemySchema,
  playerMoveSchema,
  updateTimeSchema,
  errorMatchSchema,
  updateAllSchema,
  gameMessageOutputSchema,
  gameMessageInputSchema,
  userQueueSchema,
  fruitsSchema,
  infoSchema,
  customMapKeySchema,
  pathResultSchema,
  PathResultWithDirectionSchema,
  BoardStorageSchema,
  MatchStorageSchema,
};
