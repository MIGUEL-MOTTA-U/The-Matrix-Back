import { Prisma } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import ErrorTemplate from '../errors/ErrorTemplate.js';
import { logger } from '../server.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (error: unknown, _request: FastifyRequest, response: FastifyReply) => {
  // Aqui pal manejo de errores
  logger.warn('An error occurred...');
  logger.error(error);
  if (error instanceof ZodError) {
    return response.status(400).send({
      statusCode: 400,
      message: 'Bad request',
    });
  }

  // Manejo de errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Errores con código P2002 indican violación de restricción única
    if (error.code === 'P2002') {
      return response.status(409).send({
        statusCode: 409,
        message: 'Conflict: Resource already exists',
        details: error.meta?.target ? `Duplicate entry for: ${error.meta.target}` : undefined,
      });
    }
    // P2025 significa registro no encontrado
    if (error.code === 'P2025') {
      return response.status(404).send({
        statusCode: 404,
        message: 'Not Found: Resource does not exist',
      });
    }
    // Otros errores conocidos de Prisma
    return response.status(400).send({
      statusCode: 400,
      message: 'Database request error',
      code: error.code,
    });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return response.status(400).send({
      statusCode: 400,
      message: 'Validation error in database query',
    });
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return response.status(500).send({
      statusCode: 500,
      message: 'Database runtime error',
    });
  }

  // An error from customized error class
  if (error instanceof ErrorTemplate) {
    return response.status(error.code).send({
      statusCode: error.code,
      message: error.message,
    });
  }

  return response.status(500).send({
    statusCode: 500,
    message: 'Something went wrong',
  });
};
