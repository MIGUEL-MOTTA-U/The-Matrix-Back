import { z } from 'zod';
const stringSchema = z.string().nonempty().min(1);
const matchInputDTOSchema = z.object({
  level: z.number().nonnegative(),
  map: z.string().nonempty(),
});
const boardItemSchema = z.object({
  type: z.string().nonempty(),
  id: z.string().optional(),
  orientation: z.string().optional(),
  color: z.string().optional(),
});
const cellCordinatesSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
});

const cellDTOSchema = z.object({
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  item: boardItemSchema.nullable(),
  character: boardItemSchema.nullable(),
});

const playerStateSchema = z.object({
  id: z.string().nonempty(),
  state: z.enum(['dead', 'alive']),
  color: z.string().optional(),
});

const EndMatchSchema = z.object({
  result: z.enum(['win', 'lose']),
});

const updateEnemySchema = z.object({
  enemyId: z.string().nonempty(),
  coordinates: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
  }),
  direction: z.enum(['up', 'down', 'left', 'right']),
});

const playerMoveSchema = z.object({
  id: z.string().nonempty(),
  coordinates: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
  }),
  direction: z.enum(['up', 'down', 'left', 'right']),
  state: z.enum(['alive', 'dead']),
  idItemConsumed: z.string().optional(),
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
  board: z.array(cellDTOSchema),
  time: updateTimeSchema,
});

const gameMessageInputSchema = z.object({
  type: z.enum(['movement', 'exec-power', 'rotate', 'set-color']),
  payload: z.union([z.enum(['up', 'down', 'left', 'right']), z.string()]),
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
  ]),
  payload: z.union([
    playerMoveSchema,
    EndMatchSchema,
    updateEnemySchema,
    updateTimeSchema,
    errorMatchSchema,
    updateAllSchema,
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
  matchId: z.string().nonempty(),
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
};
