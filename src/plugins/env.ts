import fastifyEnv from '@fastify/env';
import { config } from 'dotenv';
import type { FastifyInstance } from 'fastify';

config();

const schema = {
  type: 'object',
  required: ['PORT', 'HOST'],
  properties: {
    TIMER_SPEED_MS: {
      type: 'number',
      default: 1000, // 1 second
    },
    ENEMIES_SPEED_MS: {
      type: 'number',
      default: 1000, // 1 second
    },
    MATCH_TIME_SECONDS: {
      type: 'number',
      default: 300, // 5 minutes
    },
    PORT: {
      type: 'string',
      default: '3000',
    },
    HOST: {
      type: 'string',
      default: '0.0.0.0',
    },
    NODE_ENV: {
      type: 'string',
      default: 'development',
    },
    JWT_SECRET: {
      type: 'string',
      default: 'supersecretkey',
    },
    CORS_ORIGIN: {
      type: 'string',
      default: '*',
    },
    LOG_LEVEL: {
      type: 'string',
      default: 'info',
    },
    REDIS_URL: {
      type: 'string',
      default: 'redis://localhost:10923', // We can run it with Docker
    },
    TIME_TO_GENERATE_FRUIT: {
      type: 'number',
      default: 120, // 2 minutes
    },
    AZURE_CLIENT_ID: {
      type: 'string',
      default: 'azure-client-id',
    },
    AZURE_CLIENT_SECRET: {
      type: 'string',
      default: 'azure-client-secret',
    },
    AZURE_TENANT_ID: {
      type: 'string',
      default: 'azure-tenant-id',
    },
    AZURE_API_APP_ID: {
      type: 'string',
      default: 'azure-api-app-id',
    },
    MATCH_TIME_OUT_SECONDS: {
      type: 'number',
      default: 180, // 3 minutes
    },
  },
};

export const envOptions = {
  confKey: 'config',
  schema: schema,
  dotenv: true,
  data: process.env,
};

export async function configureEnv(server: FastifyInstance): Promise<void> {
  await server.register(fastifyEnv, envOptions);
}

// Definir tipos importados
export type EnvConfig = {
  TIMER_SPEED_MS: number;
  ENEMIES_SPEED_MS: number;
  MATCH_TIME_SECONDS: number;
  PORT: number;
  HOST: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  REDIS_URL: string;
  TIME_TO_GENERATE_FRUIT: number;
  AZURE_CLIENT_ID: string;
  AZURE_CLIENT_SECRET: string;
  AZURE_TENANT_ID: string;
  AZURE_API_APP_ID: string;
  MATCH_TIME_OUT_SECONDS: number;
};

// Extender FastifyInstance para incluir config y poder hacer ---> fastify.config.PORT <---- por ejmplo
declare module 'fastify' {
  interface FastifyInstance {
    config: EnvConfig;
  }
}
