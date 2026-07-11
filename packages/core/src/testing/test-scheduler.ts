import type { Scheduler, TimerId } from "../engines/scheduler.js";

/** A Scheduler whose clock only moves when you call `advance`. Fires due timers in time order, honoring re-arms. */
export interface TestScheduler extends Scheduler {
  advance(ms: number): void;
  pending(): number;
}

export function createTestScheduler(startMs = 1_700_000_000_000): TestScheduler {
  let clock = startMs;
  let nextId = 1;
  const timers = new Map<TimerId, { at: number; fn: () => void }>();

  return {
    now: () => clock,
    setTimer(fn, ms) {
      const id = nextId++;
      timers.set(id, { at: clock + ms, fn });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    advance(ms) {
      const target = clock + ms;
      for (;;) {
        let due: TimerId | null = null;
        let dueAt = Infinity;
        for (const [id, t] of timers) {
          if (t.at <= target && t.at < dueAt) {
            due = id;
            dueAt = t.at;
          }
        }
        if (due === null) break;
        const t = timers.get(due)!;
        timers.delete(due);
        clock = t.at;
        t.fn(); // may re-arm timers, which the next iteration picks up
      }
      clock = target;
    },
    pending: () => timers.size,
  };
}
