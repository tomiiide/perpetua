import {
  dec,
  decDiv,
  decIsZero,
  decMul,
  decSub,
  decToNumber,
  type BookEvent,
  type BookLevel,
  type Candle,
  type Dec,
  type Market,
  type MarketId,
  type Prices,
  type Trade,
} from "@perpetua/core";
import type { HlAssetCtx, HlBookLevel, HlCandle, HlL2Book, HlUniverseAsset, HlWsTrade } from "./types.js";

const VENUE_ID = "hyperliquid";
const PREFIX = `${VENUE_ID}:`;

export function toMarketId(coin: string): MarketId {
  return `${PREFIX}${coin}` as MarketId;
}

export function coinFromMarketId(marketId: MarketId): string {
  if (!marketId.startsWith(PREFIX)) {
    throw new Error(`not a hyperliquid MarketId: ${marketId}`);
  }
  return marketId.slice(PREFIX.length);
}

function pow10Dec(exp: number): Dec {
  return dec(`1e${exp}`);
}

/**
 * HL perp prices are capped at 5 significant figures AND at most
 * (6 - szDecimals) decimal places. We only model the decimal-place cap here;
 * the 5-sig-fig cap is a separate HL-specific quirk not representable as a
 * single tickSize and is intentionally not enforced by this approximation.
 */
export function deriveTickSize(szDecimals: number): Dec {
  const decimalPlaces = Math.max(0, 6 - szDecimals);
  return pow10Dec(-decimalPlaces);
}

export function deriveLotSize(szDecimals: number): Dec {
  return pow10Dec(-szDecimals);
}

const BASE_MAKER_FEE = dec("0.00015");
const BASE_TAKER_FEE = dec("0.00045");
const MIN_NOTIONAL = dec("10");

export function mapMarket(asset: HlUniverseAsset, ctx: HlAssetCtx | undefined): Market {
  const coin = asset.name;
  return {
    id: toMarketId(coin),
    symbol: `${coin}-PERP`,
    base: coin,
    quote: "USD",
    type: "perp",
    tickSize: deriveTickSize(asset.szDecimals),
    lotSize: deriveLotSize(asset.szDecimals),
    minNotional: MIN_NOTIONAL,
    maxLeverage: asset.maxLeverage,
    makerFee: BASE_MAKER_FEE,
    takerFee: BASE_TAKER_FEE,
  };
}

export function mapBookLevel(level: HlBookLevel): BookLevel {
  return {
    price: dec(level.px),
    size: dec(level.sz),
    orderCount: level.n,
    minExpiry: null,
  };
}

/** HL's l2Book pushes a complete top-of-book snapshot on every update, never a diff. */
export function mapBookSnapshot(book: HlL2Book): BookEvent & { type: "snapshot" } {
  const [bidLevels, askLevels] = book.levels;
  return {
    type: "snapshot",
    bids: bidLevels.map(mapBookLevel),
    asks: askLevels.map(mapBookLevel),
    ts: book.time,
  };
}

export function mapTrade(trade: HlWsTrade): Trade {
  return {
    id: String(trade.tid),
    marketId: toMarketId(trade.coin),
    price: dec(trade.px),
    size: dec(trade.sz),
    side: trade.side === "B" ? "buy" : "sell",
    ts: trade.time,
    synthetic: false,
  };
}

export function mapCandle(candle: HlCandle): Candle {
  return {
    ts: candle.t,
    open: dec(candle.o),
    high: dec(candle.h),
    low: dec(candle.l),
    close: dec(candle.c),
    volume: dec(candle.v),
    closed: candle.T <= Date.now(),
  };
}

/**
 * HL exposes only `oraclePx`, used both as the margining oracle and as the
 * closest analog to an "index" price — there is no separate index feed.
 * We map it to `oracle` and leave `index` null rather than fabricate a
 * distinct value (CORE_SPEC.md gap policy).
 */
export function mapPrices(ctx: HlAssetCtx, ts: number): Prices {
  return {
    mark: dec(ctx.markPx),
    index: null,
    oracle: dec(ctx.oraclePx),
    ts,
    stale: false,
  };
}

export function change24hPct(ctx: HlAssetCtx): number {
  const prev = dec(ctx.prevDayPx);
  const mark = dec(ctx.markPx);
  if (decIsZero(prev)) return 0;
  const ratio = decDiv(decSub(mark, prev), prev);
  return decToNumber(decMul(ratio, dec("100")));
}
