import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';
import type { Logger } from '@dev-darshan/platform';
import { registerErrorHandling } from './http/error-handler';
import { healthRoutes } from './modules/health/health.routes';

export interface AppDeps {
  logger: Logger;
  genRequestId: () => string;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    loggerInstance: deps.logger as FastifyBaseLogger,
    requestIdHeader: 'x-request-id', // keep the gateway's ID when it sends one
    genReqId: () => deps.genRequestId(), // otherwise make a new one
    requestIdLogLabel: 'requestId',
    bodyLimit: 64 * 1024,
  });

  // Tell the client which ID to quote in a bug report.
  app.addHook('onSend', async (request, reply) => {
    reply.header('x-request-id', request.id);
  });

  registerErrorHandling(app);
  await app.register(healthRoutes);

  return app;
}