import { loadConfig } from '@dev-darshan/platform';
import { buildApp } from './app';
import { ApiConfig } from './config';
import { createDeps } from './composition-root';
import { execSync } from 'child_process';

const config = loadConfig(ApiConfig);
const { deps, shutdown } = createDeps(config);
const app = await buildApp(deps);

try {
    await app.listen({ port: config.PORT, host: config.HOST });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      app.log.warn(`Port ${config.PORT} busy, killing old process...`);
      const cmd = `lsof -ti:${config.PORT} | xargs kill -9`;
      try {
        execSync(cmd);
      } catch {
        app.log.error('Failed to kill existing process');
      }

      await new Promise((res) => setTimeout(res, 250));
      await app.listen({ port: config.PORT, host: config.HOST });
    } else {
      app.log.error(err);
      process.exit(1);
    }
  }
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    app.log.info({ signal }, 'Shutting down');
    await app.close(); // 1. stop taking requests, finish the ones in flight
    await shutdown(); // 2. then close the database pool those requests were using
    process.exit(0);
  });
}