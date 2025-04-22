import type { FastifyInstance } from 'fastify';
import type MatchMakingService from '../app/lobbies/services/MatchMakingService.js';
import MatchMaking from '../app/lobbies/services/MatchmakingImpl.js';
import type WebSocketService from '../app/lobbies/services/WebSocketService.js';
import WebsocketServiceImpl from '../app/lobbies/services/WebSocketServiceImpl.js';
import GameController from '../controllers/websockets/GameController.js';
import MatchMakingController from '../controllers/websockets/MatchMakingController.js';
import type MatchRepository from '../schemas/MatchRepository.js';
import MatchRepositoryRedis from '../schemas/MatchRepositoryRedis.js';
import type UserRepository from '../schemas/UserRepository.js';
import UserRepositoryRedis from '../schemas/UserRepositoryRedis.js';

const userRepository: UserRepository = UserRepositoryRedis.getInstance();
const matchRepository: MatchRepository = MatchRepositoryRedis.getInstance();
const matchMakingService: MatchMakingService = MatchMaking.getInstance(
  matchRepository,
  userRepository
);
const webSocketService: WebSocketService = WebsocketServiceImpl.getInstance(
  matchMakingService,
  matchRepository
);

const matchMakingController: MatchMakingController = MatchMakingController.getInstance(
  webSocketService,
  matchRepository,
  userRepository
);
const gameController: GameController = GameController.getInstance(matchRepository, userRepository);

export async function websocketRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * This method works then i am looking for a matchmaking (no teamate)
   */
  fastify.get('/matchmaking/:matchId', { websocket: true }, (connection, req) => {
    matchMakingController.handleMatchMaking(connection, req);
  });

  /**
   * This route works then i am looking for a game (with teamate) (the match is already created and I know it's id)
   */
  fastify.get('/game/:userId/:matchId', { websocket: true }, (connection, req) => {
    gameController.handleGameConnection(connection, req);
  });
}
