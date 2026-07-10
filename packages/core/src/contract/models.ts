import type { Dec, MarketId, PositionSide, Side, Ts } from "./dec.js";

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
  tickSize: Dec;
  lotSize: Dec;
  minNotional: Dec | null;
  maxLeverage: number | null;
  makerFee: Dec;
  takerFee: Dec;
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
  price: Dec;
  size: Dec;
  orderCount: number | null;
  minExpiry: Ts | null;
}

/** Engine OUTPUT: which rendered levels changed, for flash animations. */
export type LevelFlash = { price: Dec; side: Side; dir: "up" | "down" | "new" | "gone" };

/** Venue INPUT: a raw level mutation on the wire. size 0 = remove level. */
export type LevelDelta = { side: Side; price: Dec; size: Dec };

/** Venue → engine events. The engine, not the venue, owns ordering/gap logic. */
export type BookEvent =
  | { type: "snapshot"; seq?: number; bids: BookLevel[]; asks: BookLevel[]; ts: Ts }
  | { type: "diff"; seq?: number; deltas: LevelDelta[]; ts: Ts };

export interface BookState {
  marketId: MarketId;
  bids: BookLevel[];
  asks: BookLevel[];
  mid: Dec | null;
  spread: Dec | null;
  spreadPct: number | null;
  imbalance: number | null;
  grouping: Dec;
  status: "connecting" | "live" | "stale" | "resyncing" | "error";
  ts: Ts;
  changes: LevelFlash[];
  /** batch-auction venues only (null on continuous). */
  clearingPrice: Dec | null;
  nextAuctionIn: number | null;
}

// ───────────────────────────── trades / candles ─────────────────────────────

export interface Trade {
  id: string;
  marketId: MarketId;
  price: Dec;
  size: Dec;
  side: Side | null;
  ts: Ts;
  synthetic: boolean;
}

export interface Candle {
  ts: Ts;
  open: Dec;
  high: Dec;
  low: Dec;
  close: Dec;
  volume: Dec;
  closed: boolean;
}

// ───────────────────────────── pricing / funding ─────────────────────────────

export interface Prices {
  mark: Dec | null;
  index: Dec | null;
  oracle: Dec | null;
  ts: Ts;
  stale: boolean;
}

export interface Funding {
  /** Normalized sign: POSITIVE = longs pay shorts, on all venues. */
  rate: Dec;
  predicted: Dec | null;
  nextAt: Ts | null;
  indexCum: Dec | null;
  intervalUs: number | null;
  ts: Ts;
}

export interface MarketStats {
  vol24h: Dec;
  high24h: Dec;
  low24h: Dec;
  change24hPct: number;
  openInterest: Dec | null;
  lastPrice: Dec;
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
  price: Dec | null;
  size: Dec;
  filled: Dec;
  avgFillPrice: Dec | null;
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
  price: Dec;
  size: Dec;
  fee: Dec | null;
  ts: Ts;
}

export interface OrderRequest {
  marketId: MarketId;
  side: Side;
  type: OrderType;
  price?: Dec;
  size: Dec;
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
  triggerPrice: Dec;
  limitPrice: Dec | null;
  size: Dec;
  side: Side;
  reduceOnly: boolean;
}

export interface Trigger {
  id: string;
  marketId: MarketId;
  type: "takeProfit" | "stopLoss";
  triggerPrice: Dec;
  limitPrice: Dec | null;
  size: Dec;
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
  size: Dec;
  notional: Dec;
  entryPrice: Dec;
  markPrice: Dec;
  liqPrice: Dec | null;
  margin: Dec;
  leverage: number;
  marginMode: "cross" | "isolated" | null;
  uPnl: Dec;
  rPnl: Dec;
  roe: number;
  fundingAccrued: Dec | null;
  tpsl: { tp: Dec | null; sl: Dec | null };
}

export interface SpotHolding {
  kind: "spot";
  marketId: MarketId;
  balance: Dec;
  free: Dec;
  locked: Dec;
  costBasis: Dec | null;
  markPrice: Dec;
  uPnl: Dec | null;
  rPnl: Dec | null;
}

export interface AccountSnapshot {
  positions: Position[];
  equity: Dec;
  cash: Dec | null;
  withdrawable: Dec;
  totalUPnl: Dec;
  totalRPnl: Dec;
  marginUsed: Dec;
  maintenanceMargin: Dec;
  health: { ratio: number; band: "safe" | "warn" | "danger" };
  ts: Ts;
}

export interface Balance {
  asset: string;
  total: Dec;
  free: Dec;
  locked: Dec;
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
