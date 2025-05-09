import { fastifyAwilixPlugin } from '@fastify/awilix';
import { Lifetime, asClass, asValue } from 'awilix';
import type { FastifyInstance } from 'fastify';
import GameServiceImpl from '../app/game/services/GameServiceImpl.js';
import type MatchMakingService from '../app/lobbies/services/MatchMakingService.js';
import MatchMaking from '../app/lobbies/services/MatchmakingImpl.js';
import type WebSocketService from '../app/lobbies/services/WebSocketService.js';
import WebsocketServiceImpl from '../app/lobbies/services/WebSocketServiceImpl.js';
import MatchController from '../controllers/rest/MatchController.js';
import UserController from '../controllers/rest/UserController.js';
import GameController from '../controllers/websockets/GameController.js';
import MatchMakingController from '../controllers/websockets/MatchMakingController.js';
import GameCacheRedis from '../schemas/repositories/GameCacheRedis.js';
import MatchRepositoryPostgres from '../schemas/repositories/MatchRepositoryPostgres.js';
import UserRepositoryPostgres from '../schemas/repositories/UserRepositoryPostgres.js';
import { container } from './diContainer.js';
const registerDependencies = (server: FastifyInstance) => {
  container.register({
    redis: asValue(server.redis),
    prisma: asValue(server.prisma),
    gameCache: asClass(GameCacheRedis, { lifetime: Lifetime.SINGLETON }),
    userRepository: asClass(UserRepositoryPostgres, { lifetime: Lifetime.SINGLETON }),
    matchRepository: asClass(MatchRepositoryPostgres, { lifetime: Lifetime.SINGLETON }),
    webSocketService: asClass(WebsocketServiceImpl, { lifetime: Lifetime.SINGLETON }),
    matchMakingService: asClass(MatchMaking, { lifetime: Lifetime.SINGLETON }),
    gameService: asClass(GameServiceImpl, { lifetime: Lifetime.SINGLETON }),
    gameController: asClass(GameController, { lifetime: Lifetime.SINGLETON }),
    matchController: asClass(MatchController, { lifetime: Lifetime.SINGLETON }),
    userController: asClass(UserController, { lifetime: Lifetime.SINGLETON }),
    matchMakingController: asClass(MatchMakingController, { lifetime: Lifetime.SINGLETON }),
  });
};
const setupCircularDeps = () => {
  const webSocketService = container.resolve<WebSocketService>('webSocketService');
  const matchMaking = container.resolve<MatchMakingService>('matchMakingService');
  webSocketService.setMatchMakingService(matchMaking);
};
export async function configureDI(server: FastifyInstance): Promise<void> {
  registerDependencies(server);
  setupCircularDeps();
  server.register(fastifyAwilixPlugin, {
    container,
    disposeOnClose: true,
    disposeOnResponse: true,
  });
}
