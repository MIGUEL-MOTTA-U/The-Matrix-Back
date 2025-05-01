import { PrismaClient } from '@prisma/client';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

// Augment the FastifyInstance type
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

// Create the Prisma plugin
const prismaPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient();

  // Make Prisma Client available through the fastify instance
  fastify.decorate('prisma', prisma);

  // Close the Prisma Client when the server is shutting down
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
