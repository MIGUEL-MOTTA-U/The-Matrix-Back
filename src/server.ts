import { isMainThread } from 'node:worker_threads';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { envOptions } from './plugins/env.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/register.js';
// Set up Fastify instance with TypeBox
const server = Fastify({
  logger: {
    level: envOptions.schema.properties.LOG_LEVEL.default,
    transport: envOptions.schema.properties.LOG_LEVEL.default
      ? { target: 'pino-pretty' }
      : undefined,
  },
}).withTypeProvider<TypeBoxTypeProvider>();
// Register plugins
await registerPlugins(server);

// Register routes
await registerRoutes(server);

// Start the server
const start = async () => {
  try {
    const port = server.config.PORT;
    const host = server.config.HOST;
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    console.log('There has been an error');
    console.log(err);
    process.exit(1);
  }
};

// To close the server gracefully
const closeGracefully = async (signal: string) => {
  server.log.info(`\nKilling server ;-; ${signal} I'm dying...\nR.I.P. Server`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start the server if it's the main thread
if (isMainThread) {
  start();
}
// Instead of console.log, use server logger.
export const logger = server.log;
// Instead of redis, use server redis.
export const redis = server.redis;
// We can use the server config directly for enviroment variables.
export const config = server.config;
