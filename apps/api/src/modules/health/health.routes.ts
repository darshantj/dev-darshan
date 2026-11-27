import type { FastifyPluginAsync } from 'fastify';

export type ReadinessCheck = () => Promise<void>;

export interface HealthRoutesOptions {
  checks: Record<string, ReadinessCheck>;
}

export const healthRoutes: FastifyPluginAsync<HealthRoutesOptions> = async (app, { checks }) => {
  // Liveness: the process is up.
  app.get('/health', async () => ({ status: 'ok' }));

  // Readiness: every dependency answers. Runs all checks at once and reports each one.
  app.get('/ready', async (request, reply) => {
    const results = await Promise.all(
      Object.entries(checks).map(async ([name, check]) => {
        try {
          await check();
          return [name, 'ok'] as const;
        } catch (err) {
          request.log.warn({ err, check: name }, 'Readiness check failed');
          return [name, 'fail'] as const;
        }
      }),
    );
    const ready = results.every(([, status]) => status === 'ok');
    return reply
      .status(ready ? 200 : 503)
      .send({ status: ready ? 'ready' : 'not_ready', checks: Object.fromEntries(results) });
  });
};
