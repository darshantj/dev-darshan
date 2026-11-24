import type { FastifyPluginAsync } from 'fastify';

/** Liveness: the process is up and answering. (Readiness, which checks the database) */
export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => ({ status: 'ok' }));
};