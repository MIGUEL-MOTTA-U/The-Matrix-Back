import { isMainThread } from 'node:worker_threads';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { envOptions } from './plugins/env.js';
import { registerPlugins } from './plugins/index.js';
import { registerRoutes } from './routes/register.js';
// Crear instancia de Fastify con TypeBox
const server = Fastify({
  logger: {
    level: envOptions.schema.properties.LOG_LEVEL.default,
    transport: envOptions.schema.properties.LOG_LEVEL.default
      ? { target: 'pino-pretty' }
      : undefined,
  },
}).withTypeProvider<TypeBoxTypeProvider>();
// Registrar plugins
await registerPlugins(server);

// Registrar rutas
await registerRoutes(server);

// Iniciar
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

// Pa cerrarlo
const closeGracefully = async (signal: string) => {
  server.log.info(`\nKilling server ;-; ${signal} I'm dying...\nR.I.P. Server`);
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Iniciar el servidor
if (isMainThread && server.config.NODE_ENV !== 'test') {
  start();
}

// Instead of console.log, use server logger.
export const logger = server.log;
// Instead of redis, use server redis.
export const redis = server.redis;

export const config = server.config;
