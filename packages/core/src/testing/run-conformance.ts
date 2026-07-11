import { dec, decCmp, decRoundToStep, ZERO } from "../decimal/index.js";
import { ValidationError } from "../contract/index.js";
import type {
  BookLevel,
  Candle,
  Capabilities,
  EventSink,
  Market,
  MarketDataVenue,
  Resolution,
  Subscription,
  Trade,
  Ts,
  VenueEvent,
} from "../contract/index.js";

export interface ConformanceFailure {
  check: string;
  detail: string;
}

export interface ConformanceReport {
  venue: string;
  checks: number;
  failures: ConformanceFailure[];
  passed: boolean;
}

const RESOLUTIONS: Resolution[] = [
  "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "1w", "1M",
];
const MATCHING = ["continuous", "batchAuction"];
const BOOK_FEED = ["diff", "pushSnapshot", "pollSnapshot"];
const ORDER_IDENTITY = ["clientId", "derived", "none"];
const TIFS = ["GTC", "IOC", "FOK", "ALO", "GTT"];

/** Drives a MarketDataVenue purely through its public contract and returns every invariant violation. */
export async function runConformance(venue: MarketDataVenue): Promise<ConformanceReport> {
  const failures: ConformanceFailure[] = [];
  let checks = 0;

  const check = (name: string, ok: boolean, detail = ""): void => {
    checks++;
    if (!ok) failures.push({ check: name, detail });
  };
  const isDec = (x: unknown): boolean => {
    if (typeof x !== "string") return false;
    try {
      dec(x);
      return true;
    } catch {
      return false;
    }
  };
  const isNullOrDec = (x: unknown): boolean => x === null || isDec(x);
  const isPosDec = (x: unknown): boolean => isDec(x) && decCmp(dec(x as string), ZERO) > 0;
  const isNonNegDec = (x: unknown): boolean => isDec(x) && decCmp(dec(x as string), ZERO) >= 0;
  const isMs = (ts: unknown): boolean => typeof ts === "number" && Number.isInteger(ts) && ts >= 1e12 && ts < 1e13;
  const aligned = (value: string, step: string): boolean =>
    decCmp(decRoundToStep(dec(value), dec(step), "nearest"), dec(value)) === 0;

  // collect events emitted for a subscription across one microtask burst
  const collect = async (sub: Subscription): Promise<VenueEvent[]> => {
    const events: VenueEvent[] = [];
    const off = venue.subscribe(sub, (e) => events.push(e));
    for (let i = 0; i < 5; i++) await Promise.resolve();
    off();
    return events;
  };

  // ── 1. capabilities ──────────────────────────────────────────────
  const caps: Capabilities = venue.capabilities();
  check("caps.matching", MATCHING.includes(caps.matching), caps.matching);
  check("caps.bookFeed", BOOK_FEED.includes(caps.bookFeed), caps.bookFeed);
  check("caps.orderIdentity", ORDER_IDENTITY.includes(caps.orderIdentity), caps.orderIdentity);
  check("caps.sequenceNumbers.bool", typeof caps.sequenceNumbers === "boolean");
  check("caps.publicTape.bool", typeof caps.publicTape === "boolean");
  check("caps.candleResolutions.nonEmpty", caps.candleResolutions.length > 0);
  check("caps.candleResolutions.domain", caps.candleResolutions.every((r) => RESOLUTIONS.includes(r)));
  check("caps.tifs.domain", caps.tifs.every((t) => TIFS.includes(t)));
  check("caps.marketTypes.nonEmpty", caps.marketTypes.length > 0);
  check(
    "caps.auctionInterval.iffBatch",
    caps.matching === "batchAuction"
      ? typeof caps.auctionIntervalUs === "number" && caps.auctionIntervalUs > 0
      : caps.auctionIntervalUs === undefined,
  );

  // ── 2. markets ───────────────────────────────────────────────────
  const markets: Market[] = await venue.markets();
  check("markets.nonEmpty", markets.length > 0);
  const ids = new Set<string>();
  for (const m of markets) {
    const at = `market ${m.id}`;
    check("market.id.unique", !ids.has(m.id), at);
    ids.add(m.id);
    check("market.id.qualified", m.id.startsWith(`${venue.id}:`), `${at}: expected "${venue.id}:" prefix`);
    check("market.tickSize.pos", isPosDec(m.tickSize), `${at}: ${m.tickSize}`);
    check("market.lotSize.pos", isPosDec(m.lotSize), `${at}: ${m.lotSize}`);
    check("market.makerFee.dec", isDec(m.makerFee), at);
    check("market.takerFee.dec", isDec(m.takerFee), at);
    check("market.minNotional", isNullOrDec(m.minNotional), at);
    check("market.maxLeverage", m.maxLeverage === null || (Number.isInteger(m.maxLeverage) && m.maxLeverage > 0), at);
    check("market.type.inCaps", caps.marketTypes.includes(m.type), at);
    check("market.symbol.nonEmpty", m.symbol.length > 0 && m.base.length > 0 && m.quote.length > 0, at);
  }
  check("markets.deterministic", JSON.stringify(await venue.markets()) === JSON.stringify(markets));

  const sample = markets[0];
  if (!sample) return finalize(venue.id, checks, failures);
  const marketId = sample.id;

  const checkLevel = (lv: BookLevel, where: string): void => {
    check("book.level.price.pos", isPosDec(lv.price), `${where}: ${lv.price}`);
    check("book.level.size.pos", isPosDec(lv.size), `${where}: ${lv.size}`);
    check("book.level.price.aligned", aligned(lv.price, sample.tickSize), `${where}: ${lv.price} vs tick ${sample.tickSize}`);
    check("book.level.size.aligned", aligned(lv.size, sample.lotSize), `${where}: ${lv.size} vs lot ${sample.lotSize}`);
    check("book.level.orderCount", lv.orderCount === null || (Number.isInteger(lv.orderCount) && lv.orderCount >= 0), where);
  };
  const checkSnapshotShape = (bids: BookLevel[], asks: BookLevel[], where: string): void => {
    for (const b of bids) checkLevel(b, `${where} bid`);
    for (const a of asks) checkLevel(a, `${where} ask`);
    for (let i = 1; i < bids.length; i++) check("book.bids.descending", decCmp(dec(bids[i - 1]!.price), dec(bids[i]!.price)) > 0, where);
    for (let i = 1; i < asks.length; i++) check("book.asks.ascending", decCmp(dec(asks[i - 1]!.price), dec(asks[i]!.price)) < 0, where);
    if (bids[0] && asks[0]) check("book.notCrossed", decCmp(dec(bids[0].price), dec(asks[0].price)) < 0, where);
  };

  // ── 3. book snapshot (fetch) ─────────────────────────────────────
  const snap = await venue.fetchBookSnapshot(marketId);
  check("fetchBookSnapshot.type", snap.type === "snapshot");
  check("fetchBookSnapshot.ts", isMs(snap.ts), String(snap.ts));
  checkSnapshotShape(snap.bids, snap.asks, "fetchBookSnapshot");

  // ── 4. book subscription: shape, seq consistency, ts monotonic ───
  const bookEvents = await collect({ kind: "book", marketId });
  check("book.sub.kind", bookEvents.every((e) => e.kind === "book"), "non-book event from book sub");
  let lastBookTs: Ts | null = null;
  for (const e of bookEvents) {
    if (e.kind !== "book") continue;
    const ev = e.event;
    check("book.event.ts", isMs(ev.ts), String(ev.ts));
    if (lastBookTs !== null) check("book.ts.nonDecreasing", ev.ts >= lastBookTs, `${ev.ts} < ${lastBookTs}`);
    lastBookTs = ev.ts;
    check("book.seq.matchesCaps", caps.sequenceNumbers ? typeof ev.seq === "number" : ev.seq === undefined, `seq=${ev.seq}`);
    if (ev.type === "snapshot") checkSnapshotShape(ev.bids, ev.asks, "book snapshot");
    else for (const d of ev.deltas) {
      check("book.delta.side", d.side === "buy" || d.side === "sell", d.side);
      check("book.delta.price.aligned", aligned(d.price, sample.tickSize), d.price);
      check("book.delta.size", isNonNegDec(d.size), d.size); // 0 = remove
    }
  }

  // ── 5. trades ────────────────────────────────────────────────────
  if (caps.publicTape) {
    const tradeEvents = await collect({ kind: "trades", marketId });
    check("trades.sub.kind", tradeEvents.every((e) => e.kind === "trades"));
    for (const e of tradeEvents) if (e.kind === "trades") for (const t of e.trades) checkTrade(t, check, isPosDec, isMs);
  } else {
    check("trades.gated", (await collect({ kind: "trades", marketId })).length === 0, "publicTape false but trades emitted");
  }

  // ── 6. candles: valid resolution + strict ascending + OHLC sanity ─
  const res = caps.candleResolutions[0]!;
  const candles = await venue.fetchCandles(marketId, res, { from: 1_700_000_000_000, to: 1_700_000_000_000 + 20 * 60_000 });
  for (let i = 0; i < candles.length; i++) {
    checkCandle(candles[i]!, i === candles.length - 1, check, isNonNegDec, isMs);
    if (i > 0) check("candles.ascending", candles[i]!.ts > candles[i - 1]!.ts, `${candles[i]!.ts}`);
  }

  // ── 7. typed rejection: unsupported subscription throws ValidationError (decision #2)
  const badRes = RESOLUTIONS.find((r) => !caps.candleResolutions.includes(r));
  if (badRes) {
    check("reject.candleResolution", throwsValidation(() => venue.subscribe({ kind: "candle", marketId, resolution: badRes }, noop)), `resolution ${badRes} should throw`);
    check("reject.fetchCandles", await rejectsValidation(() => venue.fetchCandles(marketId, badRes, { from: 0, to: 1 })), "fetchCandles should reject");
  }

  // ── 8. unsubscribe stops emission ────────────────────────────────
  const after: VenueEvent[] = [];
  venue.subscribe({ kind: "book", marketId }, (e) => after.push(e))();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  check("unsubscribe.silences", after.length === 0, `${after.length} events after immediate unsubscribe`);

  // ── 9. concurrent subscriptions are isolated ─────────────────────
  const a: VenueEvent[] = [];
  const b: VenueEvent[] = [];
  const offA = venue.subscribe({ kind: "book", marketId }, (e) => a.push(e));
  venue.subscribe({ kind: "book", marketId }, (e) => b.push(e));
  offA();
  for (let i = 0; i < 5; i++) await Promise.resolve();
  check("isolation.a.silenced", a.length === 0, `${a.length}`);
  check("isolation.b.alive", b.length > 0, "second subscription got nothing");

  return finalize(venue.id, checks, failures);
}

const noop: EventSink = () => {};

function finalize(venue: string, checks: number, failures: ConformanceFailure[]): ConformanceReport {
  return { venue, checks, failures, passed: failures.length === 0 };
}

function throwsValidation(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof ValidationError;
  }
}

async function rejectsValidation(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (e) {
    return e instanceof ValidationError;
  }
}

function checkTrade(
  t: Trade,
  check: (n: string, ok: boolean, d?: string) => void,
  isPosDec: (x: unknown) => boolean,
  isMs: (x: unknown) => boolean,
): void {
  check("trade.price.pos", isPosDec(t.price), t.price);
  check("trade.size.pos", isPosDec(t.size), t.size);
  check("trade.side", t.side === null || t.side === "buy" || t.side === "sell", String(t.side));
  check("trade.ts", isMs(t.ts), String(t.ts));
  check("trade.synthetic.bool", typeof t.synthetic === "boolean", t.id);
}

function checkCandle(
  c: Candle,
  isLast: boolean,
  check: (n: string, ok: boolean, d?: string) => void,
  isNonNegDec: (x: unknown) => boolean,
  isMs: (x: unknown) => boolean,
): void {
  check("candle.ts", isMs(c.ts), String(c.ts));
  for (const k of ["open", "high", "low", "close"] as const) check(`candle.${k}.dec`, isNonNegDec(c[k]), `${k}=${c[k]}`);
  check("candle.volume.nonNeg", isNonNegDec(c.volume), c.volume);
  check("candle.low<=open", decCmp(dec(c.low), dec(c.open)) <= 0, `${c.low} ${c.open}`);
  check("candle.low<=close", decCmp(dec(c.low), dec(c.close)) <= 0, `${c.low} ${c.close}`);
  check("candle.high>=open", decCmp(dec(c.high), dec(c.open)) >= 0, `${c.high} ${c.open}`);
  check("candle.high>=close", decCmp(dec(c.high), dec(c.close)) >= 0, `${c.high} ${c.close}`);
  check("candle.low<=high", decCmp(dec(c.low), dec(c.high)) <= 0, `${c.low} ${c.high}`);
  check("candle.closed.bool", typeof c.closed === "boolean", String(c.closed));
  if (!isLast) check("candle.onlyLastOpen", c.closed, "non-final candle must be closed");
}
