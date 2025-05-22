import fastifyWebsocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';

export async function configureWebSocket(server: FastifyInstance): Promise<void> {
  // await server.register(fastifyWebsocket, {
  //   options: { maxPayload: 1048576 /*pingInterval: 30000, pongTimeout: 10000*/ },
  // });
  await server.register(fastifyWebsocket, {
    options: {
      // Este callback se ejecuta antes de aceptar la conexión
      verifyClient: async (info, next) => {
        try {
          // Puedes enviar el token en headers o en Sec-WebSocket-Protocol
          const token = info.req.headers['sec-websocket-protocol']?.toString();
          if (!token) throw new Error('Token missing');
          await server.verifyToken(token);
          next(true); // acepta
        } catch {
          next(false, 401, 'Unauthorized'); // rechaza
        }
      },
      maxPayload: 1048576,
    },
  });
}
