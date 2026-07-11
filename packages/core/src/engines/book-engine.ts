import {
  dec,
  decAdd,
  decCmp,
  decDiv,
  decMul,
  decStepCount,
  decSub,
  decToNumber,
  decToString,
  ZERO,
} from "../decimal/index.js";
import type { Dec } from "../decimal/index.js";
import type {
  BookEvent,
  BookLevel,
  BookState,
  LevelDelta,
  LevelFlash,
  MarketId,
  Side,
  Ts,
} from "../contract/index.js";
import type { Scheduler, TimerId } from "./scheduler.js";

type Status = BookState["status"];

export interface BookEngineConfig {
  marketId: MarketId;
  tickSize: string;
  lotSize: string;
  /** capabilities.sequenceNumbers — off means no-seq fallback (periodic refresh). */
  hasSequence: boolean;
  scheduler: Scheduler;
  onState: (state: BookState) => void;
  /** Fetch a fresh snapshot and feed it back via applyEvent (resync / no-seq refresh). */
  requestSnapshot: () => void;
  grouping?: string;
  depth?: number;
  staleAfter?: number;
  frameBudget?: number;
  refreshInterval?: number;
}

/**
 * A level in the integer domain: price as whole tickSize units, size as whole
 * lotSize units. Parsing/rounding happens once at insert; the per-flush hot
 * path (sort + group) is then pure integer math, no decimal ops per level.
 */
interface Level {
  ticks: number; // price / tickSize — exact integer, also the sort key
  lots: bigint; // size / lotSize — exact integer
  orderCount: number | null;
}

/**
 * Pure order-book state machine (CORE_SPEC.md §5.6). Fed venue BookEvents,
 * emits coalesced BookState. Owns: pre-snapshot buffering, seq-gap resync,
 * no-seq periodic refresh, derived grouping, flash tagging, staleness.
 */
export class BookEngine {
  private readonly cfg: Required<BookEngineConfig>;
  private readonly tickDec: Dec;
  private readonly lotDec: Dec;
  private readonly bids = new Map<string, Level>();
  private readonly asks = new Map<string, Level>();
  private bidLots = 0n; // running totals — keep imbalance O(1) per flush
  private askLots = 0n;
  private sortedBids: Level[] | null = null; // cached sort; invalidated only when the price set changes
  private sortedAsks: Level[] | null = null;
  private buffered: (BookEvent & { type: "diff" })[] = [];
  private lastSeq: number | null = null;
  private hasSnapshot = false;
  private status: Status = "connecting";
  private lastTs: Ts = 0;
  private prevRendered = new Map<string, string>(); // "side:price" -> size
  private emitTimer: TimerId | null = null;
  private staleTimer: TimerId | null = null;
  private refreshTimer: TimerId | null = null;
  private disposed = false;

  constructor(config: BookEngineConfig) {
    this.cfg = {
      ...config,
      grouping: config.grouping ?? config.tickSize,
      depth: config.depth ?? Infinity,
      staleAfter: config.staleAfter ?? 5_000,
      frameBudget: config.frameBudget ?? 16,
      refreshInterval: config.refreshInterval ?? 30_000,
    };
    this.tickDec = dec(config.tickSize);
    this.lotDec = dec(config.lotSize);
    if (!this.cfg.hasSequence) this.armRefresh();
  }

  applyEvent(ev: BookEvent): void {
    if (this.disposed) return;
    this.resetStale();
    if (ev.type === "snapshot") this.applySnapshot(ev);
    else this.applyDiff(ev);
  }

  setGrouping(grouping: string): void {
    if (grouping === this.cfg.grouping) return;
    this.cfg.grouping = grouping;
    this.scheduleEmit();
  }

  dispose(): void {
    this.disposed = true;
    for (const t of [this.emitTimer, this.staleTimer, this.refreshTimer]) {
      if (t !== null) this.cfg.scheduler.clearTimer(t);
    }
    this.emitTimer = this.staleTimer = this.refreshTimer = null;
  }

  // ── ingestion ────────────────────────────────────────────────────

  private applySnapshot(ev: BookEvent & { type: "snapshot" }): void {
    this.bids.clear();
    this.asks.clear();
    this.bidLots = 0n;
    this.askLots = 0n;
    this.sortedBids = null;
    this.sortedAsks = null;
    for (const l of ev.bids) this.setLevel("buy", l);
    for (const l of ev.asks) this.setLevel("sell", l);
    this.lastSeq = ev.seq ?? null;
    this.hasSnapshot = true;
    this.lastTs = ev.ts;
    this.status = "live";
    this.replayBuffer();
    this.scheduleEmit();
  }

  private applyDiff(ev: BookEvent & { type: "diff" }): void {
    if (!this.hasSnapshot) {
      this.buffered.push(ev); // point 1: diffs before snapshot are buffered
      return;
    }
    if (this.cfg.hasSequence && ev.seq != null && this.lastSeq != null) {
      if (ev.seq <= this.lastSeq) return; // already applied / duplicate
      if (ev.seq !== this.lastSeq + 1) {
        // point 2: seq gap → resync, never render a book known to be wrong
        this.status = "resyncing";
        this.hasSnapshot = false;
        this.buffered.push(ev);
        this.cfg.requestSnapshot();
        this.scheduleEmit();
        return;
      }
    }
    for (const d of ev.deltas) this.applyDelta(d);
    if (ev.seq != null) this.lastSeq = ev.seq;
    this.lastTs = ev.ts;
    this.status = "live";
    this.scheduleEmit();
  }

  private replayBuffer(): void {
    if (this.buffered.length === 0) return;
    const sorted = this.buffered.slice().sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    this.buffered = [];
    for (const ev of sorted) {
      if (this.lastSeq != null && ev.seq != null) {
        if (ev.seq <= this.lastSeq) continue; // included in snapshot
        if (ev.seq !== this.lastSeq + 1) {
          // still gapped after the fresh snapshot — keep waiting
          this.status = "resyncing";
          this.hasSnapshot = false;
          this.buffered.push(ev);
          this.cfg.requestSnapshot();
          return;
        }
      }
      for (const d of ev.deltas) this.applyDelta(d);
      if (ev.seq != null) this.lastSeq = ev.seq;
      this.lastTs = ev.ts;
    }
  }

  private setLevel(side: Side, l: BookLevel): void {
    this.putLevel(side, l.price, dec(l.size), l.orderCount);
  }

  private applyDelta(d: LevelDelta): void {
    const sizeDec = dec(d.size);
    if (decCmp(sizeDec, ZERO) === 0) this.removeLevel(d.side, d.price); // size 0 = remove
    else this.putLevel(d.side, d.price, sizeDec, null);
  }

  /** Insert/replace a level (converting to integer tick/lot units), keeping the running lot total in sync. */
  private putLevel(side: Side, price: string, sizeDec: Dec, orderCount: number | null): void {
    const map = side === "buy" ? this.bids : this.asks;
    const lots = decStepCount(sizeDec, this.lotDec, "nearest");
    const existing = map.get(price);
    if (existing) {
      // size-only update: mutate in place so the cached sort order stays valid
      if (side === "buy") this.bidLots += lots - existing.lots;
      else this.askLots += lots - existing.lots;
      existing.lots = lots;
      existing.orderCount = orderCount;
      return;
    }
    const ticks = Number(decStepCount(dec(price), this.tickDec, "nearest"));
    map.set(price, { ticks, lots, orderCount });
    if (side === "buy") {
      this.bidLots += lots;
      this.sortedBids = null; // new price → sort order changed
    } else {
      this.askLots += lots;
      this.sortedAsks = null;
    }
  }

  private removeLevel(side: Side, price: string): void {
    const map = side === "buy" ? this.bids : this.asks;
    const prev = map.get(price);
    if (!prev) return;
    if (side === "buy") {
      this.bidLots -= prev.lots;
      this.sortedBids = null;
    } else {
      this.askLots -= prev.lots;
      this.sortedAsks = null;
    }
    map.delete(price);
  }

  // ── timers ───────────────────────────────────────────────────────

  private scheduleEmit(): void {
    if (this.emitTimer !== null || this.disposed) return; // coalesce: ≤1 emit per frameBudget
    this.emitTimer = this.cfg.scheduler.setTimer(() => {
      this.emitTimer = null;
      this.flush();
    }, this.cfg.frameBudget);
  }

  private resetStale(): void {
    if (this.staleTimer !== null) this.cfg.scheduler.clearTimer(this.staleTimer);
    this.staleTimer = this.cfg.scheduler.setTimer(() => {
      this.staleTimer = null;
      if (this.status === "live") {
        this.status = "stale"; // point 6
        this.scheduleEmit();
      }
    }, this.cfg.staleAfter);
  }

  private armRefresh(): void {
    this.refreshTimer = this.cfg.scheduler.setTimer(() => {
      this.refreshTimer = null;
      if (!this.disposed) {
        this.cfg.requestSnapshot(); // point 3: no-seq fallback
        this.armRefresh();
      }
    }, this.cfg.refreshInterval);
  }

  // ── emission ─────────────────────────────────────────────────────

  private flush(): void {
    if (this.disposed) return;
    const bids = this.render("buy");
    const asks = this.render("sell");
    const bestBid = bids[0]?.price ?? null;
    const bestAsk = asks[0]?.price ?? null;

    let mid: string | null = null;
    let spread: string | null = null;
    let spreadPct: number | null = null;
    if (bestBid !== null && bestAsk !== null) {
      const bb = dec(bestBid);
      const ba = dec(bestAsk);
      mid = decToString(decDiv(decAdd(bb, ba), dec("2")));
      spread = decToString(decSub(ba, bb));
      spreadPct = decToNumber(decDiv(decSub(ba, bb), dec(mid))) * 100;
    }

    this.cfg.onState({
      marketId: this.cfg.marketId,
      bids,
      asks,
      mid,
      spread,
      spreadPct,
      imbalance: this.imbalance(),
      grouping: this.cfg.grouping,
      status: this.status,
      ts: this.lastTs,
      changes: this.flashes(bids, asks),
      clearingPrice: null,
      nextAuctionIn: null,
    });
  }

  /**
   * Render one side: grouping as a derived view over the cached sorted levels
   * (point 4). Because the source is sorted by price, same-bucket levels are
   * contiguous — so bucketing is a single linear scan with no hash map, and a
   * depth-limited book stops after `depth` buckets instead of scanning the rest.
   */
  private render(side: Side): BookLevel[] {
    let sorted = side === "buy" ? this.sortedBids : this.sortedAsks;
    if (sorted === null) {
      const map = side === "buy" ? this.bids : this.asks;
      sorted = [...map.values()].sort((a, b) => (side === "buy" ? b.ticks - a.ticks : a.ticks - b.ticks));
      if (side === "buy") this.sortedBids = sorted;
      else this.sortedAsks = sorted;
    }

    const groupTicks = Math.max(1, Number(decStepCount(dec(this.cfg.grouping), this.tickDec, "nearest")));
    const depth = this.cfg.depth;
    const out: BookLevel[] = [];
    let curBt: number | null = null;
    let curLots = 0n;
    let curOrders: number | null = 0;

    const emitBucket = (): void => {
      out.push({
        price: decToString(decMul(this.tickDec, dec(String(curBt)))),
        size: decToString(decMul(this.lotDec, dec(curLots.toString()))),
        orderCount: curOrders,
        minExpiry: null,
      });
    };

    for (const lvl of sorted) {
      const bt =
        side === "buy"
          ? Math.floor(lvl.ticks / groupTicks) * groupTicks
          : Math.ceil(lvl.ticks / groupTicks) * groupTicks;
      if (curBt === null) {
        curBt = bt;
        curLots = lvl.lots;
        curOrders = lvl.orderCount;
      } else if (bt === curBt) {
        curLots += lvl.lots;
        curOrders = curOrders != null && lvl.orderCount != null ? curOrders + lvl.orderCount : null;
      } else {
        emitBucket();
        if (out.length >= depth) return out; // depth reached — skip the rest of the book
        curBt = bt;
        curLots = lvl.lots;
        curOrders = lvl.orderCount;
      }
    }
    if (curBt !== null && out.length < depth) emitBucket();
    return out;
  }

  private imbalance(): number | null {
    if (this.bids.size === 0 || this.asks.size === 0) return null;
    const total = this.bidLots + this.askLots;
    if (total === 0n) return null;
    return Number(this.bidLots - this.askLots) / Number(total);
  }

  private flashes(bids: BookLevel[], asks: BookLevel[]): LevelFlash[] {
    const cur = new Map<string, string>();
    const out: LevelFlash[] = [];
    const scan = (levels: BookLevel[], side: Side): void => {
      for (const l of levels) {
        const k = `${side}:${l.price}`;
        cur.set(k, l.size);
        const prev = this.prevRendered.get(k);
        if (prev === undefined) out.push({ price: l.price, side, dir: "new" });
        else {
          const c = decCmp(dec(l.size), dec(prev));
          if (c > 0) out.push({ price: l.price, side, dir: "up" });
          else if (c < 0) out.push({ price: l.price, side, dir: "down" });
        }
      }
    };
    scan(bids, "buy");
    scan(asks, "sell");
    for (const [k] of this.prevRendered) {
      if (!cur.has(k)) {
        const idx = k.indexOf(":");
        out.push({ side: k.slice(0, idx) as Side, price: k.slice(idx + 1), dir: "gone" });
      }
    }
    this.prevRendered = cur;
    return out;
  }
}
