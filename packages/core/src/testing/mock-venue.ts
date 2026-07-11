import {
  dec,
  decAdd,
  decMul,
  decSub,
  decToString,
} from "../decimal/index.js";
import { ValidationError } from "../contract/index.js";
import type {
  BookEvent,
  BookLevel,
  Candle,
  Capabilities,
  EventSink,
  Market,
  MarketDataVenue,
  MarketId,
  Range,
  Resolution,
  Subscription,
  Ts,
  Unsubscribe,
} from "../contract/index.js";
import { createTestClock, type TestClock } from "./test-clock.js";

const mkId = (s: string): MarketId => s as MarketId;

const RES_MS: Record<Resolution, number> = {
  "1m": 60_000, "3m": 180_000, "5m": 300_000, "15m": 900_000, "30m": 1_800_000,
  "1h": 3_600_000, "2h": 7_200_000, "4h": 14_400_000, "8h": 28_800_000, "12h": 43_200_000,
  "1d": 86_400_000, "1w": 604_800_000, "1M": 2_592_000_000,
};

const CAPABILITIES: Capabilities = {
  matching: "continuous",
  bookFeed: "diff",
  sequenceNumbers: true,
  publicTape: true,
  candleResolutions: ["1m", "5m", "15m", "1h", "1d"],
  nativeTriggers: true,
  nativeTwap: false,
  orderIdentity: "clientId",
  batchOrders: true,
  tifs: ["GTC", "IOC", "ALO"],
  marketTypes: ["perp"],
  credential: "wallet",
};

interface Spec {
  id: string;
  symbol: string;
  base: string;
  mid: string;
  tick: string;
  lot: string;
}

const SPECS: Spec[] = [
  { id: "mock:BTC-PERP", symbol: "BTC-PERP", base: "BTC", mid: "60000", tick: "0.5", lot: "0.001" },
  { id: "mock:ETH-PERP", symbol: "ETH-PERP", base: "ETH", mid: "3000", tick: "0.05", lot: "0.01" },
];

function toMarket(s: Spec): Market {
  return {
    id: mkId(s.id),
    symbol: s.symbol,
    base: s.base,
    quote: "USD",
    type: "perp",
    tickSize: s.tick,
    lotSize: s.lot,
    minNotional: "10",
    maxLeverage: 50,
    makerFee: "0.0002",
    takerFee: "0.0005",
  };
}

/** N levels stepping away from `mid` by whole ticks; sizes are whole-lot multiples, all strictly positive. */
function levels(mid: string, tick: string, lot: string, dir: "bid" | "ask", n: number): BookLevel[] {
  const out: BookLevel[] = [];
  const t = dec(tick);
  const l = dec(lot);
  for (let i = 0; i < n; i++) {
    const step = decMul(t, dec(String(i + 1)));
    const price = dir === "bid" ? decSub(dec(mid), step) : decAdd(dec(mid), step);
    const size = decMul(l, dec(String((i + 1) * 10)));
    out.push({ price: decToString(price), size: decToString(size), orderCount: i + 1, minExpiry: null });
  }
  return out;
}

function snapshot(s: Spec, seq: number, ts: Ts): BookEvent & { type: "snapshot" } {
  return {
    type: "snapshot",
    seq,
    ts,
    bids: levels(s.mid, s.tick, s.lot, "bid", 5),
    asks: levels(s.mid, s.tick, s.lot, "ask", 5),
  };
}

function candlesIn(s: Spec, resolution: Resolution, range: Range): Candle[] {
  const stepMs = RES_MS[resolution];
  const first = Math.ceil(range.from / stepMs) * stepMs;
  const out: Candle[] = [];
  let i = 0;
  for (let ts = first; ts <= range.to; ts += stepMs) {
    const drift = decMul(dec(s.tick), dec(String(i % 3)));
    const open = decToString(decAdd(dec(s.mid), drift));
    const high = decToString(decAdd(dec(open), dec(s.tick)));
    const low = decToString(decSub(dec(open), dec(s.tick)));
    out.push({ ts, open, high, low, close: open, volume: decToString(decMul(dec(s.lot), dec("1000"))), closed: true });
    i++;
  }
  return out;
}

function specFor(marketId: MarketId): Spec {
  const s = SPECS.find((x) => x.id === marketId);
  if (!s) throw new ValidationError(`unknown market: ${marketId}`);
  return s;
}

/** Deterministic, fully conformant reference venue. Emits a scripted burst one microtask after subscribe. */
export function createMockVenue(clock: TestClock = createTestClock()): MarketDataVenue {
  const emit = (sub: Subscription, sink: EventSink): void => {
    switch (sub.kind) {
      case "book": {
        const s = specFor(sub.marketId);
        sink({ kind: "book", event: snapshot(s, 1, clock.now()) });
        sink({
          kind: "book",
          event: { type: "diff", seq: 2, ts: clock.advance(1000), deltas: [{ side: "buy", price: decToString(decSub(dec(s.mid), decMul(dec(s.tick), dec("6")))), size: decToString(decMul(dec(s.lot), dec("5"))) }] },
        });
        sink({
          kind: "book",
          event: { type: "diff", seq: 3, ts: clock.advance(1000), deltas: [{ side: "sell", price: decToString(decAdd(dec(s.mid), decMul(dec(s.tick), dec("5")))), size: "0" }] },
        });
        return;
      }
      case "trades":
      case "liquidations": {
        const s = specFor(sub.kind === "trades" ? sub.marketId : SPECS[0]!.id as MarketId);
        sink({
          kind: sub.kind,
          trades: [{ id: "t1", marketId: mkId(s.id), price: s.mid, size: s.lot, side: "buy", ts: clock.now(), synthetic: false }],
        });
        return;
      }
      case "candle": {
        const s = specFor(sub.marketId);
        const from = clock.now();
        const [candle] = candlesIn(s, sub.resolution, { from, to: from + RES_MS[sub.resolution] });
        if (candle) sink({ kind: "candle", candle });
        return;
      }
      case "markPrice":
      case "indexPrice": {
        const s = specFor(sub.marketId);
        sink({ kind: sub.kind, prices: { mark: s.mid, index: s.mid, oracle: s.mid, ts: clock.now(), stale: false } });
        return;
      }
      case "funding": {
        specFor(sub.marketId);
        sink({ kind: "funding", funding: { rate: "0.0001", predicted: "0.00012", nextAt: clock.now() + 3_600_000, indexCum: null, intervalUs: 3_600_000_000, ts: clock.now() } });
        return;
      }
      case "stats": {
        const s = specFor(sub.marketId);
        sink({ kind: "stats", stats: { vol24h: "1000000", high24h: decToString(decAdd(dec(s.mid), dec(s.tick))), low24h: decToString(decSub(dec(s.mid), dec(s.tick))), change24hPct: 1.5, openInterest: "5000", lastPrice: s.mid, ts: clock.now() } });
        return;
      }
    }
  };

  return {
    id: "mock",
    capabilities: () => CAPABILITIES,
    markets: async () => SPECS.map(toMarket),
    subscribe: (sub: Subscription, sink: EventSink): Unsubscribe => {
      if (sub.kind === "candle" && !CAPABILITIES.candleResolutions.includes(sub.resolution)) {
        throw new ValidationError(`unsupported candle resolution: ${sub.resolution}`);
      }
      if ("marketId" in sub) specFor(sub.marketId); // validate up front, synchronously
      let active = true;
      queueMicrotask(() => {
        if (active) emit(sub, sink);
      });
      return () => {
        active = false;
      };
    },
    fetchBookSnapshot: async (marketId) => snapshot(specFor(marketId), 1, clock.now()),
    fetchCandles: async (marketId, resolution, range) => {
      const s = specFor(marketId);
      if (!CAPABILITIES.candleResolutions.includes(resolution)) {
        throw new ValidationError(`unsupported candle resolution: ${resolution}`);
      }
      return candlesIn(s, resolution, range);
    },
  };
}
