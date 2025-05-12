import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import type UserRepository from '../../schemas/UserRepository.js';
import { validateString, validateUserQueue } from '../../schemas/zod.js';

/**
 * @class UserController
 * UserController class to handle user REST related operations.
 * @since 18/04/2025
 * @author Santigo Avellaneda, Andres Serrato and Miguel Motta
 */
export default class UserController {
  private readonly userRepository: UserRepository;
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
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
    await this.userRepository.createUser(validateUserQueue({ id: userId, matchId: null }));
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
    const user = await this.userRepository.getUserById(parsedId);
    return res.send(user);
  }

}
