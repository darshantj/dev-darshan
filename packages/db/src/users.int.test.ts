import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createDb, type DbHandle } from './client';
import { users } from './schema';

// Needs the local Postgres from `pnpm infra:up`. Each run gets its own throwaway
// database, so tests never touch dev data and never see leftovers from old runs.

try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch {
  // no .env (e.g. in CI): DATABASE_URL comes from the real environment
}

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error('DATABASE_URL is not set; integration tests need a database.');

const testDbName = `test_${randomBytes(6).toString('hex')}`;
const testDbUrl = Object.assign(new URL(adminUrl), { pathname: `/${testDbName}` }).toString();
const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

async function admin(query: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query(query);
  } finally {
    await client.end();
  }
}

let handle: DbHandle;

beforeAll(async () => {
  await admin(`CREATE DATABASE "${testDbName}"`);
  handle = createDb(testDbUrl, { max: 2 });
  await migrate(handle.db, { migrationsFolder });
});

afterAll(async () => {
  await handle?.close();
  await admin(`DROP DATABASE IF EXISTS "${testDbName}" WITH (FORCE)`);
});

beforeEach(async () => {
  await handle.db.delete(users);
});

describe('users table', () => {
  it('inserts a user and fills in the defaults', async () => {
    const [user] = await handle.db.insert(users).values({ username: 'ada' }).returning();

    expect(user).toMatchObject({
      username: 'ada',
      displayName: null,
      avatarUrl: null,
      isGuest: false,
    });
    // uuidv7(): version nibble is 7
    expect(user!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(user!.createdAt).toBeInstanceOf(Date);
  });

  it('reads back what was written', async () => {
    await handle.db
      .insert(users)
      .values({ username: 'grace', displayName: 'Grace Hopper', isGuest: true });

    const rows = await handle.db.select().from(users).where(eq(users.username, 'grace'));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ displayName: 'Grace Hopper', isGuest: true });
  });

  it('generates time-ordered ids', async () => {
    const [first] = await handle.db.insert(users).values({ username: 'first' }).returning();
    const [second] = await handle.db.insert(users).values({ username: 'second' }).returning();

    expect(first!.id < second!.id).toBe(true);
  });

  it('rejects a duplicate username', async () => {
    await handle.db.insert(users).values({ username: 'linus' });

    await expect(handle.db.insert(users).values({ username: 'linus' })).rejects.toMatchObject({
      cause: { code: '23505', constraint: 'users_username_unique' },
    });
  });
});
