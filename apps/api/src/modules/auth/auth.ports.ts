import type { User } from '@dev-darshan/db';

export interface NewGuest {
  username: string;
  displayName: string;
  expiresAt: Date;
}

/** What the auth service needs from storage. Postgres in production, a Map in tests. */
export interface UserRepo {
  createGuest(input: NewGuest): Promise<User>;
  findById(id: string): Promise<User | null>;
}

/** Thrown by a UserRepo when the username already exists. */
export class UsernameTakenError extends Error {
  constructor(public readonly username: string) {
    super(`Username "${username}" is taken`);
    this.name = 'UsernameTakenError';
  }
}
