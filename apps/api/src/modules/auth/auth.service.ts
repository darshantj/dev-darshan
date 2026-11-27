import type { User } from '@dev-darshan/db';
import type { Clock } from '@dev-darshan/platform';
import { UsernameTakenError, type UserRepo } from './auth.ports';

export interface AuthServiceDeps {
  users: UserRepo;
  clock: Clock;
  /** Returns a short random suffix, e.g. "a3f9c2e1". Injected so tests are predictable. */
  randomSuffix: () => string;
  guestTtlHours: number;
}

const MAX_NAME_ATTEMPTS = 3;

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  /** Create a guest user that expires after guestTtlHours. Retries if the random name clashes. */
  async createGuest(): Promise<User> {
    const expiresAt = new Date(
      this.deps.clock.now().getTime() + this.deps.guestTtlHours * 3_600_000,
    );

    for (let attempt = 1; attempt <= MAX_NAME_ATTEMPTS; attempt++) {
      const suffix = this.deps.randomSuffix();
      try {
        return await this.deps.users.createGuest({
          username: `guest-${suffix}`,
          displayName: `Guest ${suffix.slice(0, 4).toUpperCase()}`,
          expiresAt,
        });
      } catch (error) {
        if (!(error instanceof UsernameTakenError) || attempt === MAX_NAME_ATTEMPTS) throw error;
        // name clash: loop and try a new suffix
      }
    }
    throw new Error('unreachable');
  }
}
