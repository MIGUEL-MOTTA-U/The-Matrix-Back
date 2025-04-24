import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import MatchError from '../../errors/MatchError.js';
import type MatchRepository from '../../schemas/MatchRepository.js';
import type UserRepository from '../../schemas/UserRepository.js';
import { type MatchDetails, validateMatchInputDTO, validateString } from '../../schemas/zod.js';
/**
 * @class MatchController
 * This class handles the match creation and retrieval.
 * @since 18/04/2025
 * @author Santiago Avellaneda, Andres Serrato and Miguel Motta
 */
export default class MatchController {
  private readonly matchRepository: MatchRepository;
  private readonly userRepository: UserRepository;
  constructor(userRepository: UserRepository, matchRepository: MatchRepository) {
    this.userRepository = userRepository;
    this.matchRepository = matchRepository;
  }

  /**
   * Handles the request to get the match ID for a user.
   *
   * @param {FastifyRequest} req The request from the client.
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when the match ID is retrieved and sent.
   */
  public async handleGetMatch(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const match = await this.userRepository.getUserById(userId);
    return res.send({ matchId: match.matchId });
  }

  /**
   * Handles the request to create a match.
   *
   * @param {FastifyRequest} req The request from the client.
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when the match is created and its ID is sent.
   * @throws {MatchError} If the user is not found or is already in a match.
   */
  public async handleCreateMatch(req: FastifyRequest, res: FastifyReply): Promise<void> {
    const { userId } = req.params as { userId: string };
    const userIdParsed = validateString(userId);
    const user = await this.userRepository.getUserById(userIdParsed);
    if (user.matchId.length !== 0) {
      throw new MatchError(MatchError.PLAYER_ALREADY_IN_MATCH);
    }
    const matchInputDTO = validateMatchInputDTO(req.body as string);
    const matchDetails: MatchDetails = {
      id: uuidv4().replace(/-/g, '').slice(0, 8),
      host: userIdParsed,
      ...matchInputDTO,
    };
    this.matchRepository.createMatch(matchDetails);
    this.userRepository.updateUser(userIdParsed, { matchId: matchDetails.id });
    return res.send({ matchId: matchDetails.id });
  }

  /**
   * Handles the request to join a match.
   *
   * @param {FastifyRequest} req The request from the client.
   * @param {FastifyReply} res The response to be sent to the client.
   * @return {Promise<void>} A promise that resolves when the user joins the match.
   * @throws {MatchError} If the user is not found, the match is not found, or the user is already in a match.
   */
  public async handleJoinMatch(_req: FastifyRequest, _res: FastifyReply): Promise<void> {
    // TODO
    // Search for the match by id
    // Check if the match is already started
    // Check if the user is already in a match
    // If not, update the match with the user id and update the user with the match id
    // Then start the match
    // If the match is not found, throw an error
    // If the user is not found, throw an error
    // If the user is already in a match, throw an error
    // If the match is already started, throw an error
  }
}
