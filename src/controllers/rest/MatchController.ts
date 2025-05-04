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
    if (user.matchId !== null) {
      throw new MatchError(MatchError.PLAYER_ALREADY_IN_MATCH);
    }
    const matchInputDTO = validateMatchInputDTO(req.body as string);
    const matchDetails: MatchDetails = {
      id: uuidv4().replace(/-/g, '').slice(0, 8),
      host: userIdParsed,
      ...matchInputDTO,
    };
    await this.matchRepository.createMatch(matchDetails);
    await this.userRepository.updateUser(userIdParsed, { matchId: matchDetails.id });
    return res.send({ matchId: matchDetails.id });
  }
}
