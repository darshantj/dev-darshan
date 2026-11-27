import { describe, expect, it } from 'vitest';
import type { Clock } from '@dev-darshan/platform';
import { AuthService } from './auth.service';
import { FakeUserRepo } from './auth.fakes';
import { UsernameTakenError } from './auth.ports';

const fixedClock: Clock = { now: () => new Date('2026-11-27T10:00:00Z') };

function makeService(overrides: { suffixes?: string[]; users?: FakeUserRepo } = {}) {
  const suffixes = [...(overrides.suffixes ?? ['a3f9c2e1', 'b7d10e44', 'c0ffee00'])];
  const users = overrides.users ?? new FakeUserRepo();
  const service = new AuthService({
    users,
    clock: fixedClock,
    randomSuffix: () => suffixes.shift()!,
    guestTtlHours: 24,
  });
  return { service, users };
}

describe('AuthService.createGuest', () => {
  it('creates a guest that expires exactly 24 hours from now', async () => {
    const { service } = makeService();

    const guest = await service.createGuest();

    expect(guest.isGuest).toBe(true);
    expect(guest.username).toBe('guest-a3f9c2e1');
    expect(guest.displayName).toBe('Guest A3F9');
    expect(guest.expiresAt).toEqual(new Date('2026-11-28T10:00:00Z'));
  });

  it('tries a new name when the first one is taken', async () => {
    const users = new FakeUserRepo();
    await users.createGuest({
      username: 'guest-a3f9c2e1',
      displayName: 'x',
      expiresAt: new Date(),
    });
    const { service } = makeService({ users });

    const guest = await service.createGuest();

    expect(guest.username).toBe('guest-b7d10e44');
  });

  it('gives up after three clashes', async () => {
    const users = new FakeUserRepo();
    for (const s of ['a', 'b', 'c']) {
      await users.createGuest({ username: `guest-${s}`, displayName: 'x', expiresAt: new Date() });
    }
    const { service } = makeService({ users, suffixes: ['a', 'b', 'c'] });

    await expect(service.createGuest()).rejects.toThrow(UsernameTakenError);
  });
});
