import type { FastifyRedis } from '@fastify/redis';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { validateString } from '../../schemas/zod.js';
import { redis } from '../../server.js';
/**
 * @class UserController
 * UserController class to handle user REST related operations.
 * @since 18/04/2025
 * @author Santigo Avellaneda, Andres Serrato and Miguel Motta
 */
export default class UserController {
  // Singleton
  private static instance: UserController;
  private constructor() {}

  /**
   * Retrieves the singleton instance of the UserController class.
   *
   * @return {UserController} The singleton instance of UserController.
   */
  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * Handles the request to create a new user.
   *
   * @param {FastifyRequest} _req The request from the client (not used).
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when the user is created and its ID is sent.
   */
  public async handleCreateUser(_req: FastifyRequest, res: FastifyReply): Promise<void> {
    const userId: string = uuidv4();
    await redis.hset(`users:${userId}`, 'id', userId);
    await redis.expire(`users:${userId}`, 10 * 60);
    return res.send({ userId });
  }

  /**
   * Handles the request to retrieve a user by their ID.
   *
   * @param {FastifyRequest} req The request from the client.
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when the user data is retrieved and sent.
   */
  public async handleGetUser(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const parsedId = validateString(userId);
    const user = await redis.hgetall(`users:${parsedId}`);
    return res.send(user);
  }

  /**
   * Handles the request to retrieve all users.
   *
   * @param {FastifyRequest} _req The request from the client (not used).
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when all user data is retrieved and sent.
   */
  public async handleGetUsers(_req: FastifyRequest, res: FastifyReply): Promise<void> {
    const users = await redis.keys('users:*');
    const usersData = await Promise.all(
      users.map(async (key) => {
        return await redis.hgetall(key);
      })
    );

    return res.send(usersData);
  }
}
