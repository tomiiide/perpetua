import type { MarketId, PositionSide, Side, Ts } from "./dec.js";

// ───────────────────────────── capabilities ─────────────────────────────

export type Tif = "GTC" | "IOC" | "FOK" | "ALO" | "GTT";

export type Resolution =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1h" | "2h" | "4h" | "8h" | "12h"
  | "1d" | "1w" | "1M";

export interface Capabilities {
  matching: "continuous" | "batchAuction";
  bookFeed: "diff" | "pushSnapshot" | "pollSnapshot";
  sequenceNumbers: boolean;
  publicTape: boolean;
  candleResolutions: Resolution[];
  nativeTriggers: boolean;
  nativeTwap: boolean;
  orderIdentity: "clientId" | "derived" | "none";
  batchOrders: boolean;
  tifs: Tif[];
  marketTypes: ("perp" | "spot")[];
  auctionIntervalUs?: number;
  /** Descriptive metadata only; the actual credential TYPE is each venue factory's own typed prop. */
  credential: "wallet" | "apiKey" | null;
}

// ───────────────────────────── extension bag ─────────────────────────────

/**
 * Venues extend these via declaration merging — typed, tree-shaken, never `any`:
 *
 *   declare module '@perpetua/core' {
 *     interface MarketExt { pod?: { auctionIntervalUs: number; baseTokenAddress: string } }
 *     interface OrderExt  { pod?: { direction: PodDirection; nonce: number } }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MarketExt {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OrderExt {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TriggerExt {}

// ───────────────────────────── market ─────────────────────────────

export interface Market {
  id: MarketId;
  symbol: string;
  base: string;
  quote: string;
  type: "perp" | "spot";
  tickSize: string;
  lotSize: string;
  minNotional: string | null;
  maxLeverage: number | null;
  makerFee: string;
  takerFee: string;
  ext?: MarketExt;
}

export interface MarketList {
  all: Market[];
  byId(id: MarketId): Market | undefined;
  bySymbol(symbol: string): Market[];
  find(q: { symbol: string; venue?: string }): Market | undefined;
  byVenue(venueId: string): Market[];
}

// ───────────────────────────── order book ─────────────────────────────

export interface BookLevel {
  price: string;
  size: string;
  orderCount: number | null;
  minExpiry: Ts | null;
}

/** Engine OUTPUT: which rendered levels changed, for flash animations. */
export type LevelFlash = { price: string; side: Side; dir: "up" | "down" | "new" | "gone" };

/** Venue INPUT: a raw level mutation on the wire. size 0 = remove level. */
export type LevelDelta = { side: Side; price: string; size: string };

/** Venue → engine events. The engine, not the venue, owns ordering/gap logic. */
export type BookEvent =
  | { type: "snapshot"; seq?: number; bids: BookLevel[]; asks: BookLevel[]; ts: Ts }
  | { type: "diff"; seq?: number; deltas: LevelDelta[]; ts: Ts };

export interface BookState {
  marketId: MarketId;
  bids: BookLevel[];
  asks: BookLevel[];
  mid: string | null;
  spread: string | null;
  spreadPct: number | null;
  imbalance: number | null;
  grouping: string;
  status: "connecting" | "live" | "stale" | "resyncing" | "error";
  ts: Ts;
  changes: LevelFlash[];
  /** batch-auction venues only (null on continuous). */
  clearingPrice: string | null;
  nextAuctionIn: number | null;
}

// ───────────────────────────── trades / candles ─────────────────────────────

export interface Trade {
  id: string;
  marketId: MarketId;
  price: string;
  size: string;
  side: Side | null;
  ts: Ts;
  synthetic: boolean;
}

export interface Candle {
  ts: Ts;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closed: boolean;
}

// ───────────────────────────── pricing / funding ─────────────────────────────

export interface Prices {
  mark: string | null;
  index: string | null;
  oracle: string | null;
  ts: Ts;
  stale: boolean;
}

export interface Funding {
  /** Normalized sign: POSITIVE = longs pay shorts, on all venues. */
  rate: string;
  predicted: string | null;
  nextAt: Ts | null;
  indexCum: string | null;
  intervalUs: number | null;
  ts: Ts;
}

export interface MarketStats {
  vol24h: string;
  high24h: string;
  low24h: string;
  change24hPct: number;
  openInterest: string | null;
  lastPrice: string;
  ts: Ts;
}

// ───────────────────────────── orders / fills ─────────────────────────────

export type OrderType = "market" | "limit" | "stopMarket" | "stopLimit" | "twap";

export type OrderStatus =
  | "pending"
  | "open"
  | "partiallyFilled"
  | "filled"
  | "cancelled"
  | "rejected"
  | "expired";

export interface Order {
  id: string;
  clientId: string | null;
  marketId: MarketId;
  side: Side;
  type: OrderType;
  status: OrderStatus;
  price: string | null;
  size: string;
  filled: string;
  avgFillPrice: string | null;
  tif: Tif;
  reduceOnly: boolean;
  origin: "user" | "engine";
  expiresAt: Ts | null;
  createdAt: Ts;
  updatedAt: Ts;
  ext?: OrderExt;
}

export interface Fill {
  id: string;
  orderId: string;
  marketId: MarketId;
  side: Side;
  price: string;
  size: string;
  fee: string | null;
  ts: Ts;
}

export interface OrderRequest {
  marketId: MarketId;
  side: Side;
  type: OrderType;
  price?: string;
  size: string;
  tif: Tif;
  reduceOnly: boolean;
  clientId?: string;
}

export interface OrderAck {
  id: string;
  clientId: string | null;
  status: OrderStatus;
}

export interface TriggerRequest {
  marketId: MarketId;
  type: "takeProfit" | "stopLoss";
  triggerPrice: string;
  limitPrice: string | null;
  size: string;
  side: Side;
  reduceOnly: boolean;
}

export interface Trigger {
  id: string;
  marketId: MarketId;
  type: "takeProfit" | "stopLoss";
  triggerPrice: string;
  limitPrice: string | null;
  size: string;
  side: Side;
  reduceOnly: boolean;
  ext?: TriggerExt;
}

// ───────────────────────────── positions / account ─────────────────────────────

export type Position = PerpPosition | SpotHolding;

export interface PerpPosition {
  kind: "perp";
  marketId: MarketId;
  side: PositionSide;
  size: string;
  notional: string;
  entryPrice: string;
  markPrice: string;
  liqPrice: string | null;
  margin: string;
  leverage: number;
  marginMode: "cross" | "isolated" | null;
  uPnl: string;
  rPnl: string;
  roe: number;
  fundingAccrued: string | null;
  tpsl: { tp: string | null; sl: string | null };
}

export interface SpotHolding {
  kind: "spot";
  marketId: MarketId;
  balance: string;
  free: string;
  locked: string;
  costBasis: string | null;
  markPrice: string;
  uPnl: string | null;
  rPnl: string | null;
}

export interface AccountSnapshot {
  positions: Position[];
  equity: string;
  cash: string | null;
  withdrawable: string;
  totalUPnl: string;
  totalRPnl: string;
  marginUsed: string;
  maintenanceMargin: string;
  health: { ratio: number; band: "safe" | "warn" | "danger" };
  ts: Ts;
}

export interface Balance {
  asset: string;
  total: string;
  free: string;
  locked: string;
}

// ───────────────────────────── pagination ─────────────────────────────

export interface Page<T> {
  items: T[];
  cursor: string | null;
}

export interface HistoryQuery {
  marketId?: MarketId;
  from?: Ts;
  to?: Ts;
  cursor?: string;
  limit?: number;
}
