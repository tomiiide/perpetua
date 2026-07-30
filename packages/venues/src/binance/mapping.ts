import {
  dec,
  decToString,
  type BookLevel,
  type Candle,
  type LevelDelta,
  type Market,
  type MarketId,
  type Prices,
  type Trade,
} from "@perpkit/core";
import type {
  BnAggTrade,
  BnDepthUpdate,
  BnExchangeSymbol,
  BnForceOrder,
  BnKlineRow,
  BnMarkPriceUpdate,
  BnRawLevel,
  BnWsKlineData,
} from "./types.js";

const VENUE_ID = "binance";
const PREFIX = `${VENUE_ID}:`;

export function toMarketId(symbol: string): MarketId {
  return `${PREFIX}${symbol}` as MarketId;
}

export function symbolFromMarketId(marketId: MarketId): string {
  if (!marketId.startsWith(PREFIX)) {
    throw new Error(`not a binance MarketId: ${marketId}`);
  }
  return marketId.slice(PREFIX.length);
}

export function streamName(symbol: string, channel: string): string {
  return `${symbol.toLowerCase()}@${channel}`;
}

const BASE_MAKER_FEE = dec("0.0002");
const BASE_TAKER_FEE = dec("0.0005");

function filterValue(
  sym: BnExchangeSymbol,
  filterType: string,
  key: "tickSize" | "stepSize" | "notional",
): string | null {
  const filter = sym.filters.find((f) => f.filterType === filterType);
  return filter?.[key] ?? null;
}

/** Leverage brackets live behind an authed endpoint, so maxLeverage is honestly null (gap policy). */
export function mapMarket(sym: BnExchangeSymbol): Market | null {
  const tickSize = filterValue(sym, "PRICE_FILTER", "tickSize");
  const stepSize = filterValue(sym, "LOT_SIZE", "stepSize");
  if (tickSize === null || stepSize === null) return null;
  const notional = filterValue(sym, "MIN_NOTIONAL", "notional");
  return {
    id: toMarketId(sym.symbol),
    symbol: `${sym.baseAsset}-PERP`,
    base: sym.baseAsset,
    quote: sym.quoteAsset,
    type: "perp",
    tickSize: decToString(dec(tickSize)),
    lotSize: decToString(dec(stepSize)),
    minNotional: notional === null ? null : decToString(dec(notional)),
    maxLeverage: null,
    makerFee: decToString(BASE_MAKER_FEE),
    takerFee: decToString(BASE_TAKER_FEE),
  };
}

export function mapBookLevel([price, size]: BnRawLevel): BookLevel {
  return {
    price: decToString(dec(price)),
    size: decToString(dec(size)),
    orderCount: null,
    minExpiry: null,
  };
}

export function mapDepthDeltas(ev: BnDepthUpdate): LevelDelta[] {
  const deltas: LevelDelta[] = [];
  for (const [price, size] of ev.b) {
    deltas.push({ side: "buy", price: decToString(dec(price)), size: decToString(dec(size)) });
  }
  for (const [price, size] of ev.a) {
    deltas.push({ side: "sell", price: decToString(dec(price)), size: decToString(dec(size)) });
  }
  return deltas;
}

export function mapAggTrade(trade: BnAggTrade): Trade {
  return {
    id: String(trade.a),
    marketId: toMarketId(trade.s),
    price: decToString(dec(trade.p)),
    size: decToString(dec(trade.q)),
    side: trade.m ? "sell" : "buy",
    ts: trade.T,
    synthetic: false,
  };
}

export function mapWsKline(k: BnWsKlineData): Candle {
  return {
    ts: k.t,
    open: decToString(dec(k.o)),
    high: decToString(dec(k.h)),
    low: decToString(dec(k.l)),
    close: decToString(dec(k.c)),
    volume: decToString(dec(k.v)),
    closed: k.x,
  };
}

export function mapKlineRow(row: BnKlineRow): Candle {
  return {
    ts: row[0],
    open: decToString(dec(row[1])),
    high: decToString(dec(row[2])),
    low: decToString(dec(row[3])),
    close: decToString(dec(row[4])),
    volume: decToString(dec(row[5])),
    closed: row[6] <= Date.now(),
  };
}

/**
 * Binance has mark + index but no third oracle feed; `oracle` stays null
 * rather than duplicating `index` (CORE_SPEC.md gap policy).
 */
export function mapPrices(ev: BnMarkPriceUpdate): Prices {
  return {
    mark: decToString(dec(ev.p)),
    index: decToString(dec(ev.i)),
    oracle: null,
    ts: ev.E,
    stale: false,
  };
}

export function mapForceOrder(ev: BnForceOrder): Trade {
  const o = ev.o;
  return {
    id: `${o.s}-${o.T}`,
    marketId: toMarketId(o.s),
    price: decToString(dec(o.ap)),
    size: decToString(dec(o.q)),
    side: o.S === "BUY" ? "buy" : "sell",
    ts: o.T,
    synthetic: false,
  };
}
