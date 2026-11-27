import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ErrorBody } from '@dev-darshan/contracts';
import { NotFoundError, createLogger } from '@dev-darshan/platform';
import { type AppDeps, buildApp } from './app';

let app: FastifyInstance;

async function makeApp(readinessChecks: AppDeps['readinessChecks'] = { postgres: async () => {} }) {
  let n = 0;
  return buildApp({
    logger: createLogger({ service: 'api-test', level: 'silent' }),
    genRequestId: () => `req-${++n}`,
    readinessChecks,
  });
}

afterEach(async () => {
  await app?.close();
});

describe('GET /health', () => {
  it('reports the process is up', async () => {
    app = await makeApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /ready', () => {
  it('is 200 when every dependency answers', async () => {
    app = await makeApp();
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ready', checks: { postgres: 'ok' } });
  });

  it('is 503 and names the dependency that failed', async () => {
    app = await makeApp({
      postgres: async () => {},
      redis: async () => {
        throw new Error('connection refused');
      },
    });
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ status: 'not_ready', checks: { postgres: 'ok', redis: 'fail' } });
  });
});

describe('request IDs', () => {
  it('creates one when none is sent and returns it in the header', async () => {
    app = await makeApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['x-request-id']).toBe('req-1');
  });

  it("keeps the gateway's ID when one is sent", async () => {
    app = await makeApp();
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { 'x-request-id': 'from-gateway' },
    });
    expect(res.headers['x-request-id']).toBe('from-gateway');
  });
});

describe('error handling', () => {
  it('answers unknown routes with the shared error body', async () => {
    app = await makeApp();
    const res = await app.inject({ method: 'GET', url: '/nope' });
    expect(res.statusCode).toBe(404);
    expect(ErrorBody.parse(res.json()).error.code).toBe('NOT_FOUND');
  });

  it('turns an AppError into its status and code', async () => {
    app = await makeApp();
    app.get('/test/missing', async () => {
      throw new NotFoundError('Image');
    });

    const res = await app.inject({ method: 'GET', url: '/test/missing' });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Image not found', requestId: 'req-1' },
    });
  });

  it('hides the details of unexpected errors', async () => {
    app = await makeApp();
    app.get('/test/crash', async () => {
      throw new Error('database password is hunter2');
    });

    const res = await app.inject({ method: 'GET', url: '/test/crash' });

    expect(res.statusCode).toBe(500);
    expect(res.json().error).toEqual({
      code: 'INTERNAL',
      message: 'Something went wrong',
      requestId: 'req-1',
    });
    expect(res.body).not.toContain('hunter2');
  });
});
