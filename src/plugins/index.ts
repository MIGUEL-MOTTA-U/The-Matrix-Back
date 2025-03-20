import fastifyCors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { configureEnv } from './env.js';
import { handleError } from './errorsHandler.js';
import { configureRedis } from './redis.js';
import { configureStatic } from './static.js';
import { configureWebSocket } from './websocket.js';

export async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Set up environment variables
  await configureEnv(server);
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
  // Set up WebSocket
  await configureWebSocket(server);
  // Set up static files
  await configureStatic(server);
  // Set up Redis
  await configureRedis(server);

  // Aquí puedes registrar más plugins según sea necesario
}
