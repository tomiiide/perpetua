/**
 * Captured-shape Binance USDⓈ-M futures payloads (trimmed from real
 * /fapi/v1 and fstream combined-stream sessions) used by the unit and
 * conformance tests. Timestamps are pinned so runs are deterministic.
 */

import type {
  BnAggTrade,
  BnDepthSnapshot,
  BnDepthUpdate,
  BnExchangeInfo,
  BnForceOrder,
  BnKlineRow,
  BnMarkPriceUpdate,
  BnTicker24h,
  BnWsKline,
} from "../types.js";

export const T0 = 1_700_000_000_000;

export const EXCHANGE_INFO: BnExchangeInfo = {
  symbols: [
    {
      symbol: "BTCUSDT",
      status: "TRADING",
      contractType: "PERPETUAL",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      filters: [
        { filterType: "PRICE_FILTER", tickSize: "0.10" },
        { filterType: "LOT_SIZE", stepSize: "0.001" },
        { filterType: "MIN_NOTIONAL", notional: "100" },
      ],
    },
    {
      symbol: "ETHUSDT",
      status: "TRADING",
      contractType: "PERPETUAL",
      baseAsset: "ETH",
      quoteAsset: "USDT",
      filters: [
        { filterType: "PRICE_FILTER", tickSize: "0.01" },
        { filterType: "LOT_SIZE", stepSize: "0.001" },
        { filterType: "MIN_NOTIONAL", notional: "20" },
      ],
    },
    {
      symbol: "BTCUSDT_260327",
      status: "TRADING",
      contractType: "CURRENT_QUARTER",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      filters: [
        { filterType: "PRICE_FILTER", tickSize: "0.10" },
        { filterType: "LOT_SIZE", stepSize: "0.001" },
      ],
    },
    {
      symbol: "OLDUSDT",
      status: "SETTLING",
      contractType: "PERPETUAL",
      baseAsset: "OLD",
      quoteAsset: "USDT",
      filters: [
        { filterType: "PRICE_FILTER", tickSize: "0.001" },
        { filterType: "LOT_SIZE", stepSize: "1" },
      ],
    },
    {
      symbol: "BAREUSDT",
      status: "TRADING",
      contractType: "PERPETUAL",
      baseAsset: "BARE",
      quoteAsset: "USDT",
      filters: [],
    },
  ],
};

export const DEPTH_SNAPSHOT: BnDepthSnapshot = {
  lastUpdateId: 100,
  E: T0,
  T: T0 - 5,
  bids: [
    ["50000.0", "1.000"],
    ["49999.9", "0.500"],
    ["49999.8", "2.250"],
  ],
  asks: [
    ["50000.1", "0.750"],
    ["50000.2", "1.500"],
    ["50000.4", "3.000"],
  ],
};

/** Entirely covered by the snapshot (u < lastUpdateId): must be dropped. */
export const DEPTH_UPDATE_STALE: BnDepthUpdate = {
  e: "depthUpdate",
  E: T0 - 100,
  T: T0 - 105,
  s: "BTCUSDT",
  U: 90,
  u: 99,
  pu: 89,
  b: [["49999.9", "9.999"]],
  a: [],
};

/** Overlaps the snapshot boundary (U <= lastUpdateId + 1 <= u): first applied diff. */
export const DEPTH_UPDATE_BRIDGE: BnDepthUpdate = {
  e: "depthUpdate",
  E: T0 + 100,
  T: T0 + 95,
  s: "BTCUSDT",
  U: 95,
  u: 105,
  pu: 99,
  b: [["49999.9", "0.750"]],
  a: [["50000.4", "0"]],
};

/** Contiguous follower (pu equals the previous event's u). */
export const DEPTH_UPDATE_NEXT: BnDepthUpdate = {
  e: "depthUpdate",
  E: T0 + 200,
  T: T0 + 195,
  s: "BTCUSDT",
  U: 106,
  u: 110,
  pu: 105,
  b: [["49999.7", "0.250"]],
  a: [],
};

/** Gapped follower (pu skips past u=110): must trigger a resync. */
export const DEPTH_UPDATE_GAPPED: BnDepthUpdate = {
  e: "depthUpdate",
  E: T0 + 300,
  T: T0 + 295,
  s: "BTCUSDT",
  U: 115,
  u: 120,
  pu: 112,
  b: [["49999.6", "1.000"]],
  a: [],
};

/** Fresh snapshot fetched after the gap; GAPPED bridges it (U=115 <= 119, u=120 >= 118). */
export const DEPTH_SNAPSHOT_AFTER_GAP: BnDepthSnapshot = {
  lastUpdateId: 118,
  E: T0 + 250,
  T: T0 + 245,
  bids: [
    ["50000.0", "1.100"],
    ["49999.9", "0.400"],
  ],
  asks: [
    ["50000.1", "0.800"],
    ["50000.2", "1.600"],
  ],
};

export const AGG_TRADE: BnAggTrade = {
  e: "aggTrade",
  E: T0 + 50,
  s: "BTCUSDT",
  a: 26129,
  p: "50000.10",
  q: "0.004",
  f: 100,
  l: 105,
  T: T0 + 49,
  m: true,
};

export const MARK_PRICE: BnMarkPriceUpdate = {
  e: "markPriceUpdate",
  E: T0 + 1000,
  s: "BTCUSDT",
  p: "50001.10000000",
  i: "50000.90000000",
  P: "50000.50000000",
  r: "0.00010000",
  T: T0 + 3_600_000,
};

export const TICKER_24H: BnTicker24h = {
  e: "24hrTicker",
  E: T0 + 2000,
  s: "BTCUSDT",
  p: "500.10",
  P: "1.010",
  c: "50000.10",
  o: "49500.00",
  h: "50500.00",
  l: "49000.00",
  v: "120000.500",
  q: "6000000000.00",
};

export const FORCE_ORDER: BnForceOrder = {
  e: "forceOrder",
  E: T0 + 3000,
  o: {
    s: "ETHUSDT",
    S: "BUY",
    q: "2.500",
    p: "3000.55",
    ap: "3000.50",
    z: "2.500",
    T: T0 + 2999,
  },
};

export const WS_KLINE: BnWsKline = {
  e: "kline",
  E: T0 + 4000,
  s: "BTCUSDT",
  k: {
    t: T0 - (T0 % 60_000),
    T: T0 - (T0 % 60_000) + 59_999,
    s: "BTCUSDT",
    i: "1m",
    o: "50000.00",
    c: "50005.00",
    h: "50010.00",
    l: "49990.00",
    v: "12.345",
    n: 240,
    x: false,
    q: "617340.10",
  },
};

const INTERVAL_MS: Record<string, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
  "1M": 2_592_000_000,
};

/** Deterministic kline rows the way /fapi/v1/klines pages them: aligned opens, OHLC coherent. */
export function klineRows(startTime: number, endTime: number, interval: string): BnKlineRow[] {
  const step = INTERVAL_MS[interval] ?? 60_000;
  const first = Math.ceil(startTime / step) * step;
  const rows: BnKlineRow[] = [];
  for (let ts = first; ts <= endTime; ts += step) {
    rows.push([
      ts,
      "50000.00",
      "50010.00",
      "49990.00",
      "50005.00",
      "12.345",
      ts + step - 1,
      "617340.10",
      240,
      "6.100",
      "305050.00",
      "0",
    ]);
  }
  return rows;
}
