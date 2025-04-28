import type { FastifyInstance } from 'fastify';
import type GameController from '../controllers/websockets/GameController.js';
import type MatchMakingController from '../controllers/websockets/MatchMakingController.js';
import { container } from '../plugins/diContainer.js';

export async function websocketRoutes(fastify: FastifyInstance): Promise<void> {
  const matchMakingController: MatchMakingController =
    fastify.diContainer.resolve<MatchMakingController>('matchMakingController');
  const gameController: GameController = container.resolve<GameController>('gameController');
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
