import { z } from 'zod';
import type { BoardItem } from '../app/game/match/boards/BoardItem.js';

const validateMatchInputDTO = (data: unknown): MatchInputDTO => {
  const schema = z.object({
    level: z.number().nonnegative(),
    map: z.string().nonempty(),
  });
  return schema.parse(data);
};

const validateString = (data: unknown): string => {
  const schema = z.string().nonempty().min(1);
  return schema.parse(data);
};

const validateMatchDetails = (data: unknown): MatchDetails => {
  const schema = z.object({
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
  return schema.parse(data);
};

const validateUserQueue = (data: unknown): UserQueue => {
  const schema = z.object({
    id: z.string().nonempty(),
    matchId: z.string().nonempty(),
  });
  return schema.parse(data);
};
const validateGameMessage = (data: unknown): GameMessage => {
  const schema = z.object({
    type: z.string().nonempty(),
    payload: z.string().nonempty(),
  });
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
interface GameMessage {
  type: string;
  payload: string;
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
  GameMessage,
  UserQueue,
};
export {
  validateMatchInputDTO,
  validateMatchDetails,
  validateString,
  validateGameMessage,
  validateUserQueue,
};
