import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  // Postgres 18 has uuidv7() built in: time-ordered IDs, good for indexes.
  id: uuid('id').primaryKey().default(sql`uuidv7()`),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  isGuest: boolean('is_guest').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Types inferred from the table: what a row looks like, and what you may insert.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;