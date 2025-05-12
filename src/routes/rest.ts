import type { FastifyInstance } from 'fastify';
import type MatchController from '../controllers/rest/MatchController.js';
import type UserController from '../controllers/rest/UserController.js';
export async function restRoutes(fastify: FastifyInstance): Promise<void> {
  const userController = fastify.diContainer.resolve<UserController>('userController');
  const matchController = fastify.diContainer.resolve<MatchController>('matchController');
  fastify.post('/users', async (req, res) => {
    await userController.handleCreateUser(req, res);
  });

  fastify.get('/users/:userId', async (req, res) => {
    await userController.handleGetUser(req, res);
  });

  fastify.post('/users/:userId/matches', async (req, res) => {
    await matchController.handleCreateMatch(req, res);
  });

  fastify.get('/users/:userId/matches', async (req, res) => {
    await matchController.handleGetMatch(req, res);
  });

  fastify.put('/users/:userId/matches/:matchId', async (req, res) => {
    await matchController.handleUpdateMatch(req, res);
  });

  fastify.get('/health', async (_req, res) => {
    return res.send().status(200);
  });
}
