import { describe, expect, it, vi } from "vitest";
import { dec, decCmp } from "../decimal/index.js";
import type { BookEvent, BookState, MarketId, Side } from "../contract/index.js";
import { createTestScheduler } from "../testing/test-scheduler.js";
import { BookEngine, type BookEngineConfig } from "./book-engine.js";

const MKT = "mock:BTC-PERP" as MarketId;
const FRAME = 16;

type Lvl = [price: string, size: string];
const snap = (seq: number, bids: Lvl[], asks: Lvl[], ts = 1_700_000_000_000): BookEvent => ({
  type: "snapshot",
  seq,
  ts,
  bids: bids.map(([price, size]) => ({ price, size, orderCount: 1, minExpiry: null })),
  asks: asks.map(([price, size]) => ({ price, size, orderCount: 1, minExpiry: null })),
});
const diff = (seq: number, deltas: { side: Side; price: string; size: string }[], ts = 1_700_000_000_000): BookEvent => ({
  type: "diff",
  seq,
  ts,
  deltas,
});

function harness(over: Partial<BookEngineConfig> = {}) {
  const sched = createTestScheduler();
  const states: BookState[] = [];
  const requestSnapshot = vi.fn();
  const engine = new BookEngine({
    marketId: MKT,
    tickSize: "0.5",
    lotSize: "0.001",
    hasSequence: true,
    scheduler: sched,
    onState: (s) => states.push(s),
    requestSnapshot,
    ...over,
  });
  const flush = () => sched.advance(FRAME);
  return { sched, states, requestSnapshot, engine, flush, last: () => states[states.length - 1]! };
}

const notCrossed = (s: BookState): boolean =>
  !s.bids[0] || !s.asks[0] || decCmp(dec(s.bids[0].price), dec(s.asks[0].price)) < 0;

describe("BookEngine — snapshot & derived fields", () => {
  it("emits a live, sorted, uncrossed book with mid/spread", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"], ["59999.5", "2"]], [["60000.5", "1"], ["60001", "3"]]));
    h.flush();
    const s = h.last();
    expect(s.status).toBe("live");
    expect(s.bids.map((l) => l.price)).toEqual(["60000", "59999.5"]);
    expect(s.asks.map((l) => l.price)).toEqual(["60000.5", "60001"]);
    expect(s.mid).toBe("60000.25");
    expect(s.spread).toBe("0.5");
    expect(notCrossed(s)).toBe(true);
  });
});

describe("BookEngine — point 7: coalesced output, latest-wins", () => {
  it("collapses many events in one frame into a single emission", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "5" }]));
    h.engine.applyEvent(diff(3, [{ side: "buy", price: "60000", size: "9" }]));
    h.flush();
    expect(h.states).toHaveLength(1);
    expect(h.last().bids[0]!.size).toBe("9"); // latest wins
  });
});

describe("BookEngine — point 1: buffer diffs before snapshot", () => {
  it("holds pre-snapshot diffs and replays them in seq order", () => {
    const h = harness();
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "7" }]));
    expect(h.states).toHaveLength(0); // nothing emitted yet
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.flush();
    expect(h.last().bids[0]!.size).toBe("7");
  });
});

describe("BookEngine — point 2: seq-gap resync", () => {
  it("goes resyncing, requests a snapshot, and replays buffered diffs", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "2" }]));
    h.flush();
    h.engine.applyEvent(diff(4, [{ side: "buy", price: "59999.5", size: "3" }])); // gap: expected 3
    h.flush();
    expect(h.last().status).toBe("resyncing");
    expect(h.requestSnapshot).toHaveBeenCalledTimes(1);

    h.engine.applyEvent(snap(3, [["60000", "2"]], [["60001", "1"]])); // fresh snapshot
    h.flush();
    const s = h.last();
    expect(s.status).toBe("live");
    expect(s.bids.find((l) => l.price === "59999.5")?.size).toBe("3"); // buffered diff replayed
  });

  it("ignores duplicate / stale seq", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "5" }]));
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "999" }])); // stale
    h.flush();
    expect(h.last().bids[0]!.size).toBe("5");
    expect(h.requestSnapshot).not.toHaveBeenCalled();
  });
});

describe("BookEngine — deltas & invariants", () => {
  it("size 0 removes a level and never crosses the book", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"], ["59999.5", "2"]], [["60000.5", "1"]]));
    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "0" }]));
    h.flush();
    const s = h.last();
    expect(s.bids.map((l) => l.price)).toEqual(["59999.5"]);
    expect(notCrossed(s)).toBe(true);
  });
});

describe("BookEngine — point 4: grouping is a derived view", () => {
  it("regroups without re-subscribing", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"], ["59999.5", "2"], ["59999", "3"]], [["60000.5", "1"]]));
    h.flush();
    h.engine.setGrouping("1");
    h.flush();
    const s = h.last();
    expect(s.grouping).toBe("1");
    // 59999.5 and 59999 bucket down to 59999 → sizes 2+3
    expect(s.bids.find((l) => l.price === "59999")?.size).toBe("5");
    expect(h.requestSnapshot).not.toHaveBeenCalled();
  });
});

describe("BookEngine — point 5: flash tags", () => {
  it("tags new / up / down / gone", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.flush();
    expect(h.last().changes).toContainEqual({ price: "60000", side: "buy", dir: "new" });

    h.engine.applyEvent(diff(2, [{ side: "buy", price: "60000", size: "3" }]));
    h.flush();
    expect(h.last().changes).toContainEqual({ price: "60000", side: "buy", dir: "up" });

    h.engine.applyEvent(diff(3, [{ side: "buy", price: "60000", size: "2" }]));
    h.flush();
    expect(h.last().changes).toContainEqual({ price: "60000", side: "buy", dir: "down" });

    h.engine.applyEvent(diff(4, [{ side: "buy", price: "60000", size: "0" }]));
    h.flush();
    expect(h.last().changes).toContainEqual({ price: "60000", side: "buy", dir: "gone" });
  });
});

describe("BookEngine — point 6: staleness", () => {
  it("goes stale after staleAfter with no events", () => {
    const h = harness({ staleAfter: 5_000 });
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.flush();
    expect(h.last().status).toBe("live");
    h.sched.advance(5_000);
    expect(h.last().status).toBe("stale");
  });
});

describe("BookEngine — point 3: no-seq periodic refresh", () => {
  it("re-requests a snapshot every refreshInterval", () => {
    const h = harness({ hasSequence: false, refreshInterval: 30_000 });
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]])); // seq ignored when hasSequence:false
    h.sched.advance(30_000);
    h.sched.advance(30_000);
    expect(h.requestSnapshot).toHaveBeenCalledTimes(2);
  });
});

describe("BookEngine — dispose", () => {
  it("stops all timers and emissions", () => {
    const h = harness();
    h.engine.applyEvent(snap(1, [["60000", "1"]], [["60001", "1"]]));
    h.engine.dispose();
    h.sched.advance(60_000);
    expect(h.states).toHaveLength(0);
    expect(h.sched.pending()).toBe(0);
  });
});

describe("BookEngine — perf budget", () => {
  it("regroups a 5k-level book within the frame budget", () => {
    const bids: Lvl[] = [];
    const asks: Lvl[] = [];
    for (let i = 0; i < 5000; i++) {
      bids.push([`${50000 - i * 0.5}`, "1"]);
      asks.push([`${50000.5 + i * 0.5}`, "1"]);
    }
    const h = harness({ depth: 50 }); // real books render a bounded depth
    h.engine.applyEvent(snap(1, bids, asks));
    h.flush(); // warm (JIT + first render)
    // Average over N alternating regroups: sort + bucket the full 5k raw book each time.
    // Date.now is coarse, so amortize to get sub-ms resolution.
    const N = 24;
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      h.engine.setGrouping(i % 2 ? "5" : "10");
      h.flush();
    }
    const perMs = (Date.now() - t0) / N;
    console.log(`[perf] regroup 5k-level book: ${perMs.toFixed(3)}ms avg over ${N}`);
    expect(perMs).toBeLessThan(1); // CORE_SPEC.md §5.6 point 4
    expect(notCrossed(h.last())).toBe(true);
  });
});
