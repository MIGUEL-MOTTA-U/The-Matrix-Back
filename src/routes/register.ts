import type { FastifyInstance } from 'fastify';
import { restRoutes } from './rest.js';
import { websocketRoutes } from './websocket.js';

export async function registerRoutes(server: FastifyInstance): Promise<void> {
  // Websocket
  await server.register(websocketRoutes, { prefix: '/ws' });
  // REST
  await server.register(restRoutes, { prefix: '/rest' });
}
