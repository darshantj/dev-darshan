import { randomUUID } from 'node:crypto';
import { createLogger, loadConfig } from '@dev-darshan/platform';
import { buildApp } from './app';
import { ApiConfig } from './config';

const config = loadConfig(ApiConfig); // reads the real process.env, once, here at the edge
const logger = createLogger({
  service: 'api',
  level: config.LOG_LEVEL,
  pretty: config.NODE_ENV === 'development',
});

const app = await buildApp({ logger, genRequestId: randomUUID });
await app.listen({ port: config.PORT, host: config.HOST });

// Finish in-flight requests before exiting (Ctrl+C locally, `docker stop` in production).
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'Shutting down');
    await app.close();
    process.exit(0);
  });
}