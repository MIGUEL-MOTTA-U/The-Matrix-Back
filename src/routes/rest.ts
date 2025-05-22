import type { FastifyInstance } from 'fastify';
import type LoggerService from 'src/utils/LoggerService.js';
import type MatchController from '../controllers/rest/MatchController.js';
import type UserController from '../controllers/rest/UserController.js';
import type { Log } from '../schemas/zod.js';
export async function restRoutes(fastify: FastifyInstance): Promise<void> {
  const userController = fastify.diContainer.resolve<UserController>('userController');
  const matchController = fastify.diContainer.resolve<MatchController>('matchController');
  const loggerService = fastify.diContainer.resolve<LoggerService>('loggerService');

  fastify.get('/health', async (_req, res) => {
    return res.send().status(200);
  });

  fastify.get('/login', async (_req, res) => {
    const scopes = [
      `api://${fastify.config.AZURE_API_APP_ID}/access_as_user`,
      'openid',
      'offline_access',
    ].join(' ');

    const authUrl = `https://login.microsoftonline.com/${fastify.config.AZURE_TENANT_ID}/oauth2/v2.0/authorize?client_id=${fastify.config.AZURE_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(`${fastify.config.REDIRECT_URL}`)}&scope=${encodeURIComponent(scopes)}&state=abc123`;
    return res.redirect(authUrl);
  });

  fastify.get('/logout', async (_req, res) => {
    const postLogoutRedirectUri = fastify.config.LOGOUT_REDIRECT_URL;
    const logoutUrl = `https://login.microsoftonline.com/${fastify.config.AZURE_TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
    return res.redirect(logoutUrl);
  });

  fastify.get('/redirect', async (req, res) => {
    const query = req.query as unknown as { code: string };
    const code = (query.code as string) || '';
    const result = await fastify.msalClient.acquireTokenByCode({
      code,
      redirectUri: fastify.config.REDIRECT_URL,
      scopes: [
        `api://${fastify.config.AZURE_API_APP_ID}/access_as_user`,
        'openid',
        'offline_access',
      ],
    });

    if (!result || !result.accessToken) {
      return res.status(500).send({ error: 'Token exchange failed' });
    }

    return res.send({ accessToken: result.accessToken });
  });

  fastify.addHook('preHandler', async (req, reply) => {
    // Excluir rutas públicas
    const ip = req.ip;
    const logObject: Log = {
      service: 'api',
      ip: ip,
      timestamp: new Date().toISOString(),
      userId: req.hostname,
      trace: req.headers['x-trace-id'] as string,
    };

    loggerService.registerLog(logObject);

    const publicPaths = ['health', 'login', 'redirect', 'logout'];
    if (
      publicPaths.includes(req.url.split('/')[2]) ||
      publicPaths.includes(req.url.split('/')[2].split('?')[0])
    ) {
      return;
    }
    const auth = req.headers.authorization;
    if (!auth) return reply.status(401).send({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
      await fastify.verifyToken(token);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(403).send({ error: 'Forbidden' });
    }
  });

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
}
