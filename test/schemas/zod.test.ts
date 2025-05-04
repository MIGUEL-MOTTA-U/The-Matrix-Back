import { describe, it, expect } from 'vitest';
import {
  validateMatchInputDTO,
  validateMatchDetails,
  validateString,
  validateUserQueue,
  validateGameMessageOutput,
  validatePlayerState,
  validateEndMatch,
  validatePlayerMove,
  validateUpdateTime,
  validateErrorMatch,
  validateUpdateAll,
  validateBoardItemDTO,
  validateCoordinates,
  validateCellDTO,
  validateGameMesssageInput,
  validateUpdateFruits,
  validateInfo,
  validateUpdateEnemy
} from '../../src/schemas/zod.js';

describe('validateMatchInputDTO', () => {
  it('should validate correct match input DTO', () => {
    const validData = {
      level: 2,
      map: 'forest'
    };
    expect(validateMatchInputDTO(validData)).toEqual(validData);
  });

  it('should throw error for negative level', () => {
    const invalidData = {
      level: -1,
      map: 'forest'
    };
    expect(() => validateMatchInputDTO(invalidData)).toThrow();
  });

  it('should throw error for empty map', () => {
    const invalidData = {
      level: 2,
      map: ''
    };
    expect(() => validateMatchInputDTO(invalidData)).toThrow();
  });

  it('should throw error when fields are missing', () => {
    expect(() => validateMatchInputDTO({ level: 2 })).toThrow();
    expect(() => validateMatchInputDTO({ map: 'forest' })).toThrow();
    expect(() => validateMatchInputDTO({})).toThrow();
  });

  it('should throw error for invalid data types', () => {
    expect(() => validateMatchInputDTO({ level: 'two', map: 'forest' })).toThrow();
    expect(() => validateMatchInputDTO({ level: 2, map: 123 })).toThrow();
    expect(() => validateMatchInputDTO(null)).toThrow();
  });
});

describe('validateMatchDetails', () => {
  it('should validate correct match details with proper numeric level', () => {
    const validData = {
      id: 'match1',
      host: 'Alice',
      guest: null,
      level: 1,
      map: 'desert'
    };
    expect(validateMatchDetails(validData)).toEqual(validData);
  });

  it('should validate match details converting string level to number', () => {
    const inputData = {
      id: 'match2',
      host: 'Bob',
      guest: 'Charlie',
      level: '3',
      map: 'city'
    };
    const expectedOutput = {
      ...inputData,
      level: 3
    };
    expect(validateMatchDetails(inputData)).toEqual(expectedOutput);
  });

  it('should throw error when level is negative', () => {
    const invalidData = {
      id: 'match3',
      host: 'Dave',
      guest: null,
      level: -1,
      map: 'desert'
    };
    expect(() => validateMatchDetails(invalidData)).toThrow();
  });

  it('should throw error when map is empty', () => {
    const invalidData = {
      id: 'match4',
      host: 'Eve',
      guest: null,
      level: 1,
      map: ''
    };
    expect(() => validateMatchDetails(invalidData)).toThrow();
  });

  it('should throw error when required fields are missing', () => {
    expect(() => validateMatchDetails({ level: 1, map: 'desert' })).toThrow();
    expect(() => validateMatchDetails({ id: 'match5', host: 'Frank' })).toThrow();
  });

  it('should throw error when input is not an object', () => {
    expect(() => validateMatchDetails(null)).toThrow();
    expect(() => validateMatchDetails('string')).toThrow();
    expect(() => validateMatchDetails(123)).toThrow();
  });

  it('should throw error for invalid guest type', () => {
    const invalidData = {
      id: 'match6',
      host: 'George',
      guest: 123,
      level: 1,
      map: 'forest'
    };
    expect(() => validateMatchDetails(invalidData)).toThrow();
  });
});

describe('validateString', () => {
  it('should validate non-empty strings', () => {
    expect(validateString('hello')).toBe('hello');
    expect(validateString('a')).toBe('a');
  });

  it('should throw error on empty strings', () => {
    expect(() => validateString('')).toThrow();
  });

  it('should throw error on non-string inputs', () => {
    expect(() => validateString(null)).toThrow();
    expect(() => validateString(undefined)).toThrow();
    expect(() => validateString(123)).toThrow();
    expect(() => validateString({})).toThrow();
    expect(() => validateString([])).toThrow();
  });
});

describe('validateUserQueue', () => {
  it('should validate correct user queue data', () => {
    const validData = {
      id: 'user1',
      matchId: 'match1'
    };
    expect(validateUserQueue(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateUserQueue({ id: 'user1' })).toThrow();
    expect(() => validateUserQueue({ matchId: 'match1' })).toThrow();
  });

  it('should throw error for invalid data types', () => {
    expect(() => validateUserQueue({ id: 123, matchId: 'match1' })).toThrow();
    expect(() => validateUserQueue(null)).toThrow();
  });
});

describe('validateGameMessageOutput', () => {
  it('should validate correct game message output', () => {
    const validData = {
      type: 'update-state',
      payload: {
        id: 'player1',
        state: 'alive',
      }
    };
    expect(validateGameMessageOutput(validData)).toEqual(validData);
  });

  it('should throw error for invalid type', () => {
    const invalidData = {
      type: 'invalid-type',
      payload: {}
    };
    expect(() => validateGameMessageOutput(invalidData)).toThrow();
  });

  it('should throw error for missing payload', () => {
    const invalidData = {
      type: 'update-state'
    };
    expect(() => validateGameMessageOutput(invalidData)).toThrow();
  });
});

describe('validatePlayerState', () => {
  it('should validate correct player state', () => {
    const validData = {
      id: 'player1',
      state: 'alive',
      color: 'red'
    };
    expect(validatePlayerState(validData)).toEqual(validData);
  });

  it('should throw error for invalid state', () => {
    const invalidData = {
      id: 'player1',
      state: 'unknown'
    };
    expect(() => validatePlayerState(invalidData)).toThrow();
  });

  it('should throw error for missing fields', () => {
    expect(() => validatePlayerState({ id: 'player1' })).toThrow();
  });
});

describe('validateEndMatch', () => {
  it('should validate correct end match data', () => {
    const validData = {
      result: 'win'
    };
    expect(validateEndMatch(validData)).toEqual(validData);
  });

  it('should throw error for invalid result', () => {
    const invalidData = {
      result: 'unknown'
    };
    expect(() => validateEndMatch(invalidData)).toThrow();
  });
});

describe('validateUpdateEnemy', () => {
  it('should validate correct update enemy data', () => {
    const validData = {
      enemyId: 'enemy1',
      coordinates: { x: 1, y: 2 },
      direction: 'up'
    };
    expect(validateUpdateEnemy(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateUpdateEnemy({ enemyId: 'enemy1' })).toThrow();
  });
});

describe('validatePlayerMove', () => {
  it('should validate correct player move data', () => {
    const validData = {
      id: 'player1',
      coordinates: { x: 1, y: 2 },
      direction: 'down',
      state: 'alive'
    };
    expect(validatePlayerMove(validData)).toEqual(validData);
  });

  it('should throw error for invalid direction', () => {
    const invalidData = {
      id: 'player1',
      coordinates: { x: 1, y: 2 },
      direction: 'invalid',
      state: 'alive'
    };
    expect(() => validatePlayerMove(invalidData)).toThrow();
  });
});

describe('validateUpdateTime', () => {
  it('should validate correct update time data', () => {
    const validData = {
      minutesLeft: 5,
      secondsLeft: 30
    };
    expect(validateUpdateTime(validData)).toEqual(validData);
  });

  it('should throw error for negative time values', () => {
    const invalidData = {
      minutesLeft: -1,
      secondsLeft: 30
    };
    expect(() => validateUpdateTime(invalidData)).toThrow();
  });
});

describe('validateErrorMatch', () => {
  it('should validate correct error match data', () => {
    const validData = {
      error: 'An error occurred'
    };
    expect(validateErrorMatch(validData)).toEqual(validData);
  });

  it('should throw error for missing error field', () => {
    expect(() => validateErrorMatch({})).toThrow();
  });
});

describe('validateUpdateAll', () => {
  it('should validate correct update all data', () => {
    const validData = {
      players: [{ id: 'player1', state: 'alive' }],
      cells: [],
      time: { minutesLeft: 5, secondsLeft: 30 }
    };
    expect(validateUpdateAll(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateUpdateAll({ players: [] })).toThrow();
  });
});

describe('validateBoardItemDTO', () => {
  it('should validate correct board item DTO', () => {
    const validData = {
      type: 'item',
      id: 'item1',
      orientation: 'north',
      color: 'blue'
    };
    expect(validateBoardItemDTO(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateBoardItemDTO({ type: 'item' })).toThrow();
  });
});

describe('validateCoordinates', () => {
  it('should validate correct coordinates', () => {
    const validData = { x: 1, y: 2 };
    expect(validateCoordinates(validData)).toEqual(validData);
  });

  it('should throw error for invalid coordinates', () => {
    expect(() => validateCoordinates({ x: '1', y: 2 })).toThrow();
  });
});

describe('validateCellDTO', () => {
  it('should validate correct cell DTO', () => {
    const validData = {
      coordinates: { x: 1, y: 2 },
      item: null,
      character: null,
      frozen: false
    };
    expect(validateCellDTO(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateCellDTO({ coordinates: { x: 1, y: 2 } })).toThrow();
  });
});

describe('validateGameMessageInput', () => {
  it('should validate correct game message input', () => {
    const validData = {
      type: 'movement',
      payload: 'up'
    };
    expect(validateGameMesssageInput(validData)).toEqual(validData);
  });

  it('should throw error for invalid type', () => {
    const invalidData = {
      type: 'invalid',
      payload: 'up'
    };
    expect(() => validateGameMesssageInput(invalidData)).toThrow();
  });
});

describe('validateUpdateFruits', () => {
  it('should validate correct update fruits data', () => {
    const validData = {
      fruitType: 'apple',
      fruitsNumber: 5,
      cells: [],
      currentRound: 1,
      nextFruitType: 'banana'
    };
    expect(validateUpdateFruits(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateUpdateFruits({ fruitType: 'apple' })).toThrow();
  });
});

describe('validateInfo', () => {
  it('should validate correct info data', () => {
    const validData = {
      message: 'Game started'
    };
    expect(validateInfo(validData)).toEqual(validData);
  });

  it('should throw error for missing message field', () => {
    expect(() => validateInfo({})).toThrow();
  });
});

describe('validateBoardItemDTO', () => {
  it('should validate correct board item DTO', () => {
    const validData = {
      type: 'item',
      id: 'item1',
      orientation: 'north',
      color: 'blue'
    };
    expect(validateBoardItemDTO(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateBoardItemDTO({ type: 'item' })).toThrow();
  });

  it('should throw error for invalid data types', () => {
    const invalidData = {
      type: 'item',
      id: 123, // Invalid type for id
      orientation: 'north',
      color: 'blue'
    };
    expect(() => validateBoardItemDTO(invalidData)).toThrow();
  });
});

describe('validateCoordinates', () => {
  it('should validate correct coordinates', () => {
    const validData = { x: 1, y: 2 };
    expect(validateCoordinates(validData)).toEqual(validData);
  });

  it('should throw error for invalid coordinates', () => {
    expect(() => validateCoordinates({ x: '1', y: 2 })).toThrow();
    expect(() => validateCoordinates({ x: 1 })).toThrow();
    expect(() => validateCoordinates(null)).toThrow();
  });
});

describe('validateCellDTO', () => {
  it('should validate correct cell DTO', () => {
    const validData = {
      coordinates: { x: 1, y: 2 },
      item: null,
      character: null,
      frozen: false

    };
    expect(validateCellDTO(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateCellDTO({ coordinates: { x: 1, y: 2 } })).toThrow();
  });

  it('should throw error for invalid data types', () => {
    const invalidData = {
      coordinates: { x: '1', y: 2 }, // Invalid type for x
      item: null,
      character: null
    };
    expect(() => validateCellDTO(invalidData)).toThrow();
  });
});

describe('validateGameMesssageInput', () => {
  it('should validate correct game message input', () => {
    const validData = {
      type: 'movement',
      payload: 'up'
    };
    expect(validateGameMesssageInput(validData)).toEqual(validData);
  });

  it('should throw error for invalid type', () => {
    const invalidData = {
      type: 'invalid',
      payload: 'up'
    };
    expect(() => validateGameMesssageInput(invalidData)).toThrow();
  });

  it('should throw error for missing fields', () => {
    expect(() => validateGameMesssageInput({ payload: 'up' })).toThrow();
  });
});

describe('validateUpdateFruits', () => {
  it('should validate correct update fruits data', () => {
    const validData = {
      fruitType: 'apple',
      fruitsNumber: 5,
      cells: [],
      currentRound: 1,
      nextFruitType: 'banana'
    };
    expect(validateUpdateFruits(validData)).toEqual(validData);
  });

  it('should throw error for missing fields', () => {
    expect(() => validateUpdateFruits({ fruitType: 'apple' })).toThrow();
  });

  it('should throw error for invalid data types', () => {
    const invalidData = {
      fruitType: 'apple',
      fruitsNumber: 'five', // Invalid type for fruitsNumber
      cells: [],
      currentRound: 1,
      nextFruitType: 'banana'
    };
    expect(() => validateUpdateFruits(invalidData)).toThrow();
  });
});

describe('validateInfo', () => {
  it('should validate correct info data', () => {
    const validData = {
      message: 'Game started'
    };
    expect(validateInfo(validData)).toEqual(validData);
  });

  it('should throw error for missing message field', () => {
    expect(() => validateInfo({})).toThrow();
  });

  it('should throw error for invalid data types', () => {
    const invalidData = {
      message: 123 // Invalid type for message
    };
    expect(() => validateInfo(invalidData)).toThrow();
  });
});