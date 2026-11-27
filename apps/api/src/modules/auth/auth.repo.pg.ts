import { type Database, eq, users, type User } from '@dev-darshan/db';
import { UsernameTakenError, type NewGuest, type UserRepo } from './auth.ports';

/** Postgres reports unique-constraint violations as SQLSTATE 23505. Drizzle may wrap the driver error. */
function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export class PgUserRepo implements UserRepo {
  constructor(private readonly db: Database) {}

  async createGuest(input: NewGuest): Promise<User> {
    try {
      const [user] = await this.db
        .insert(users)
        .values({ ...input, isGuest: true })
        .returning();
      return user!;
    } catch (error) {
      if (isUniqueViolation(error)) throw new UsernameTakenError(input.username);
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }
}
