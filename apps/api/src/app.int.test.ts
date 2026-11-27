import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { loadConfig } from '@dev-darshan/platform';
import { buildApp } from './app';
import { createDeps } from './composition-root';
import { ApiConfig } from './config';

// Needs the local Postgres from `pnpm infra:up`. Unlike app.test.ts, this uses the
// real composition root, so /ready really queries the database. It only runs
// `select 1`, so it is safe against the dev database.

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // no .env (e.g. in CI): DATABASE_URL comes from the real environment
}

let app: FastifyInstance | undefined;
let shutdown: (() => Promise<void>) | undefined;

async function startApp(env: Record<string, string | undefined> = {}) {
  const config = loadConfig(ApiConfig, {
    ...process.env,
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    DATABASE_POOL_MAX: '2',
    ...env,
  });
  const built = createDeps(config);
  shutdown = built.shutdown;
  app = await buildApp(built.deps);
  return app;
}

afterEach(async () => {
  // Same order as server.ts: stop the app first, then close its pool.
  await app?.close();
  await shutdown?.();
  app = undefined;
  shutdown = undefined;
});

describe('GET /ready against real Postgres', () => {
  it('is 200 when the database answers', async () => {
    const res = await (await startApp()).inject({ method: 'GET', url: '/ready' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready', checks: { postgres: 'ok' } });
  });

  it('is 503 when the database cannot be reached', async () => {
    // Port 1 on localhost: nothing listens there, so the connection is refused at once.
    const res = await (
      await startApp({ DATABASE_URL: 'postgres://nobody:nothing@127.0.0.1:1/none' })
    ).inject({ method: 'GET', url: '/ready' });

    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ status: 'not_ready', checks: { postgres: 'fail' } });
  });

  it('stamps real UUID request IDs from the composition root', async () => {
    const res = await (await startApp()).inject({ method: 'GET', url: '/health' });

    expect(res.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
