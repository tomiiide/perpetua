/**
 * Timer port. Engines take a Scheduler by injection so they stay pure and
 * Web-Worker-hostable (CORE_SPEC.md §5.5) — the engine never touches a global
 * timer. Production uses `realScheduler`; tests pass a fake they advance by hand.
 */

// Typed locally so engines need neither the DOM nor @types/node lib.
declare function setTimeout(handler: () => void, timeout: number): number;
declare function clearTimeout(id: number): void;

export type TimerId = number;

export interface Scheduler {
  now(): number;
  setTimer(fn: () => void, ms: number): TimerId;
  clearTimer(id: TimerId): void;
}

export function realScheduler(): Scheduler {
  return {
    now: () => Date.now(),
    setTimer: (fn, ms) => setTimeout(fn, ms),
    clearTimer: (id) => clearTimeout(id),
  };
}
