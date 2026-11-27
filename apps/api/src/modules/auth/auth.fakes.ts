import { randomUUID } from 'node:crypto';
import type { User } from '@dev-darshan/db';
import { UsernameTakenError, type NewGuest, type UserRepo } from './auth.ports';

/** A UserRepo that keeps users in a Map. Same contract as PgUserRepo, no database. */
export class FakeUserRepo implements UserRepo {
  readonly users = new Map<string, User>();

  async createGuest(input: NewGuest): Promise<User> {
    if ([...this.users.values()].some((u) => u.username === input.username)) {
      throw new UsernameTakenError(input.username);
    }
    const user: User = {
      id: randomUUID(),
      username: input.username,
      displayName: input.displayName,
      avatarUrl: null,
      isGuest: true,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }
}
