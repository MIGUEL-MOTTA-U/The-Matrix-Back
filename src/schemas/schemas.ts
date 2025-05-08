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
const boardItemSchema = z.object({
  type: z.string().nonempty(),
  id: z.string(),
  orientation: z.string().optional(),
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
  type: z.enum(['movement', 'exec-power', 'rotate', 'set-color']),
  payload: z.union([directionSchema, z.string()]),
});

const updateFrozenCellsSchema = z.object({
  cells: z.array(cellDTOSchema),
  direction: directionSchema,
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
  matchId: z.string().nonempty().nullable(),
  color: z.string().optional(),
  role: playersTypeSchema.optional(),
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
};
