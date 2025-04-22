import type { FastifyInstance } from 'fastify';
import MatchController from '../controllers/rest/MatchController.js';
import UserController from '../controllers/rest/UserController.js';
const userController = UserController.getInstance();
const matchController = MatchController.getInstance();
export async function restRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/users', async (req, res) => {
    await userController.handleCreateUser(req, res);
  });

  fastify.get('/users/:userId', async (req, res) => {
    await userController.handleGetUser(req, res);
  });

  fastify.get('/users', async (req, res) => {
    await userController.handleGetUsers(req, res);
  });

  fastify.post('/users/:userId/matches', async (req, res) => {
    await matchController.handleCreateMatch(req, res);
  });

  fastify.get('/users/:userId/matches', async (req, res) => {
    await matchController.handleGetMatch(req, res);
  });
}
