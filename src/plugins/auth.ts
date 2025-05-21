import { ConfidentialClientApplication } from '@azure/msal-node';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyInstance {
    msalClient: ConfidentialClientApplication;
    verifyToken: (token: string) => Promise<unknown>;
  }
}
export default fp(async (server: FastifyInstance) => {
  const msalConfig = {
    auth: {
      clientId: server.config.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${server.config.AZURE_TENANT_ID}`,
      clientSecret: server.config.AZURE_CLIENT_SECRET,
      knownAuthorities: ['login.microsoftonline.com'],
    },
  };
  const msalClient = new ConfidentialClientApplication(msalConfig);
  server.decorate('msalClient', msalClient);

  const jwks = createRemoteJWKSet(new URL(`${msalConfig.auth.authority}/discovery/v2.0/keys`));

  server.decorate('verifyToken', async (token: string) => {
    const expectedAudiences = [
      `api://${server.config.AZURE_API_APP_ID}/access_as_user`,
      server.config.AZURE_API_APP_ID,
    ];
    const allowedIssuers = [
      'https://login.microsoftonline.com/common/v2.0',
      'https://login.microsoftonline.com/organizations/v2.0',
      'https://login.microsoftonline.com/consumers/v2.0',
      `https://login.microsoftonline.com/${server.config.AZURE_TENANT_ID}/v2.0`,
    ];

    const { payload } = await jwtVerify(token, jwks, {
      issuer: allowedIssuers,
      audience: expectedAudiences,
    });
    return payload;
  });
});
