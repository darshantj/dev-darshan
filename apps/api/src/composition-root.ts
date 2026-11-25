import { randomUUID } from 'node:crypto';
import { createDb, sql } from '@dev-darshan/db';
import { createLogger } from '@dev-darshan/platform';
import type { AppDeps } from './app';
import type { ApiConfig } from './config';

/** The one place that builds real dependencies. Tests never call this; they pass fakes to buildApp. */
export function createDeps(config: ApiConfig): { deps: AppDeps; shutdown: () => Promise<void> } {
  const logger = createLogger({
    service: 'api',
    level: config.LOG_LEVEL,
    pretty: config.NODE_ENV === 'development',
  });

  const database = createDb(config.DATABASE_URL, { max: config.DATABASE_POOL_MAX });

  return {
    deps: {
      logger,
      genRequestId: randomUUID,
      readinessChecks: {
        postgres: async () => {
          await database.db.execute(sql`select 1`);
        },
      },
    },
    shutdown: () => database.close(),
  };
}