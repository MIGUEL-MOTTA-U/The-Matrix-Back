import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import authPlugin from './auth.js';
import { configureDI } from './di.js';
import { configureEnv } from './env.js';
import { handleError } from './errorsHandler.js';
import prismaPlugin from './prisma.js';
import { configureRedis } from './redis.js';
import { configureStatic } from './static.js';
import { configureWebSocket } from './websocket.js';

export async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Set up environment variables
  await configureEnv(server);
  // Set up authentication
  await server.register(authPlugin);
  // Set up error handler
  server.setErrorHandler(handleError);
  // Configurar CORS
  await server.register(fastifyCors, {
    //origin: server.config.CORS_ORIGIN === '*'
    //  ? true
    //  : server.config.CORS_ORIGIN.split(','),
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  // Set up Prisma
  await server.register(prismaPlugin);
  // Set up WebSocket
  await configureWebSocket(server);
  // Set up static files
  await configureStatic(server);
  // Set up Redis
  if (server.config.NODE_ENV !== 'test') {
    await configureRedis(server);
  }
  // Set up dependency injection
  await configureDI(server);
}
