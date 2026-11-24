import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { BaseConfig, ConfigError, loadConfig } from './config';
import { NotFoundError, ValidationError, parseOrThrow, toErrorBody } from './errors';
import { createLogger } from './logger';

describe('loadConfig', () => {
  const Schema = BaseConfig.extend({ DATABASE_URL: z.url() });

  it('applies defaults', () => {
    const config = loadConfig(Schema, { DATABASE_URL: 'postgres://u:p@localhost:5432/db' });
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('names every missing variable', () => {
    expect(() => loadConfig(Schema, {})).toThrow(ConfigError);
    expect(() => loadConfig(Schema, {})).toThrow(/DATABASE_URL/);
  });
});

describe('errors', () => {
  it('builds the shared error body', () => {
    expect(toErrorBody(new NotFoundError('Image'), 'req-1')).toEqual({
      error: { code: 'NOT_FOUND', message: 'Image not found', requestId: 'req-1' },
    });
  });

  it('turns schema problems into a ValidationError', () => {
    expect(() => parseOrThrow(z.object({ n: z.number() }), { n: 'x' })).toThrow(ValidationError);
  });
});

describe('logger', () => {

    function captureLogs() {
    const lines: Array<Record<string, unknown>> = [];
    const destination = {
        write(chunk: string) {
        lines.push(JSON.parse(chunk));
        },
    };
    return { lines, destination };
    }

  it('writes one JSON object per call with the service, level, fields and message', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'info' }, destination);

    log.info({ userId: 'u1' }, 'user signed in');

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      service: 'api',
      level: 'info',
      userId: 'u1',
      msg: 'user signed in',
    });
  });

  it('drops messages below the configured level', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'info' }, destination);

    log.debug('too detailed for info');
    log.warn('worth seeing');

    expect(lines.map((l) => l.msg)).toEqual(['worth seeing']);
  });

  it('redacts passwords and tokens wherever they appear one level deep', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'info' }, destination);

    log.info({ user: { name: 'darshan', password: 'hunter2' }, worker: { token: 'abc' } }, 'oops');

    expect(lines[0]).toMatchObject({
      user: { name: 'darshan', password: '[redacted]' },
      worker: { token: '[redacted]' },
    });
    expect(JSON.stringify(lines[0])).not.toContain('hunter2');
  });

  it('redacts the Authorization and Cookie headers of a request', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'info' }, destination);

    log.info({ req: { headers: { authorization: 'Bearer secret', cookie: 'sid=1', accept: '*/*' } } });

    expect(lines[0]).toMatchObject({
      req: { headers: { authorization: '[redacted]', cookie: '[redacted]', accept: '*/*' } },
    });
  });

  it('child loggers add their fields to every line', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'info' }, destination);

    const requestLog = log.child({ requestId: 'req-42' });
    requestLog.info('first');
    requestLog.info('second');
    log.info('outside the request');

    expect(lines.map((l) => l.requestId)).toEqual(['req-42', 'req-42', undefined]);
  });

  it('silent level writes nothing (used by tests of other modules)', () => {
    const { lines, destination } = captureLogs();
    const log = createLogger({ service: 'api', level: 'silent' }, destination);

    log.error('even errors are dropped');

    expect(lines).toHaveLength(0);
  });
});