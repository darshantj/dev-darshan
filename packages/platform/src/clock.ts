/** Inject time instead of calling new Date(), so tests can control it. */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };
