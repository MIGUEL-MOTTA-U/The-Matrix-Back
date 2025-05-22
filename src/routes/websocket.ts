import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type WebSocket from 'ws';
import type GameController from '../controllers/websockets/GameController.js';
import type MatchMakingController from '../controllers/websockets/MatchMakingController.js';
import { container } from '../plugins/diContainer.js';
import { validateErrorMatch } from '../schemas/zod.js';

const errorHandler = (error: unknown, connection: WebSocket, logger: FastifyBaseLogger) => {
  logger.warn('There was an error in the websocket connection');
  logger.error(error);
  const errorMessage = validateErrorMatch({ message: 'Internal server error' });
  connection.send(JSON.stringify(errorMessage));
};

export async function websocketRoutes(fastify: FastifyInstance): Promise<void> {
  const matchMakingController: MatchMakingController =
    fastify.diContainer.resolve<MatchMakingController>('matchMakingController');
  const gameController: GameController = container.resolve<GameController>('gameController');
  /**
   * This method works then i am looking for a matchmaking (no teamate)
   */
  fastify.get('/matchmaking/:matchId', { websocket: true }, (connection, req) => {
    matchMakingController.handleMatchMaking(connection, req).catch((error) => {
      errorHandler(error, connection, fastify.log);
    });
  });

  fastify.get('/keep-playing/:userId/:matchId', { websocket: true }, (connection, req) => {
    matchMakingController.handleKeepPlaying(connection, req).catch((error) => {
      errorHandler(error, connection, fastify.log);
    });
  });

  /**
   * This route works then i am looking for a game (with teamate) (the match is already created and I know it's id)
   */
  fastify.get('/game/:userId/:matchId', { websocket: true }, (connection, req) => {
    gameController.handleGameConnection(connection, req).catch((error) => {
      errorHandler(error, connection, fastify.log);
    });
  });

  fastify.get('/publish-match/:userId/:matchId', { websocket: true }, (connection, req) => {
    matchMakingController.handlePublishMatch(connection, req).catch((error) => {
      errorHandler(error, connection, fastify.log);
    });
  });

  fastify.get('/join-game/:userId/:matchId', { websocket: true }, (connection, req) => {
    matchMakingController.handleJoinGame(connection, req).catch((error) => {
      errorHandler(error, connection, fastify.log);
    });
  });
}
