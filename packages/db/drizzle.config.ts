import { defineConfig } from 'drizzle-kit';

// Node 22 can read .env files itself, no extra library needed.
try {
  process.loadEnvFile('../../.env');
} catch {
  // no .env (e.g. in CI): DATABASE_URL comes from the real environment
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});