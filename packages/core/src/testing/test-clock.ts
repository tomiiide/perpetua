import type { Ts } from "../contract/index.js";

/** Deterministic monotonic millisecond clock. Never reads Date.now, so fixtures replay identically. */
export interface TestClock {
  now(): Ts;
  /** Advance by `ms` and return the new time. */
  advance(ms: number): Ts;
}

/** Default start: 2023-11-14T22:13:20Z, a plain epoch-ms value inside the suite's ms window. */
export function createTestClock(startMs: Ts = 1_700_000_000_000): TestClock {
  let t = startMs;
  return {
    now: () => t,
    advance: (ms) => (t += ms),
  };
}
