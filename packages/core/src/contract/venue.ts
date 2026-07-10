import type { MarketId, Ts } from "./dec.js";
import type {
  AccountSnapshot,
  Balance,
  BookEvent,
  Candle,
  Capabilities,
  Fill,
  Funding,
  HistoryQuery,
  Market,
  MarketStats,
  Order,
  OrderAck,
  OrderRequest,
  Page,
  Position,
  Prices,
  Resolution,
  Trade,
  Trigger,
  TriggerRequest,
} from "./models.js";

export type Unsubscribe = () => void;

export interface Range {
  from: Ts;
  to: Ts;
}

export type Subscription =
  | { kind: "book"; marketId: MarketId }
  | { kind: "trades"; marketId: MarketId }
  | { kind: "candle"; marketId: MarketId; resolution: Resolution }
  | { kind: "markPrice" | "indexPrice" | "funding" | "stats"; marketId: MarketId }
  | { kind: "liquidations" };

export type VenueEvent =
  | { kind: "book"; event: BookEvent }
  | { kind: "trades"; trades: Trade[] }
  | { kind: "candle"; candle: Candle }
  | { kind: "markPrice" | "indexPrice"; prices: Prices }
  | { kind: "funding"; funding: Funding }
  | { kind: "stats"; stats: MarketStats }
  | { kind: "liquidations"; trades: Trade[] };

export type EventSink = (event: VenueEvent) => void;

/**
 * Market data surface. Every venue implementation fulfills this contract;
 * ordering/gap handling is the ENGINE's job, but venues must pass through
 * sequence info when the venue provides it (CORE_SPEC.md §4).
 */
export interface MarketDataVenue {
  readonly id: string;
  capabilities(): Capabilities;
  markets(): Promise<Market[]>;
  subscribe(sub: Subscription, sink: EventSink): Unsubscribe;
  fetchBookSnapshot(marketId: MarketId): Promise<BookEvent & { type: "snapshot" }>;
  fetchCandles(marketId: MarketId, resolution: Resolution, range: Range): Promise<Candle[]>;
}

export type AccountSink<T> = (value: T) => void;

/**
 * Account/write surface. Instantiated by a venue's credential source emitting
 * a non-null value (CORE_SPEC.md §5.4) — never an imperative connect() call.
 */
export interface AccountVenue {
  // live streams
  positions(sink: AccountSink<Position[]>): Unsubscribe;
  orders(sink: AccountSink<Order[]>): Unsubscribe;
  fills(sink: AccountSink<Fill[]>): Unsubscribe;
  balances(sink: AccountSink<Balance[]>): Unsubscribe;
  triggers(sink: AccountSink<Trigger[]>): Unsubscribe;
  accountHealth(sink: AccountSink<AccountSnapshot>): Unsubscribe;

  // history (paginated behind a uniform cursor; per-venue pagination hidden here)
  fetchOrders(q: HistoryQuery): Promise<Page<Order>>;
  fetchFills(q: HistoryQuery): Promise<Page<Fill>>;

  // writes
  placeOrder(req: OrderRequest): Promise<OrderAck>;
  /** batch, capability-gated on `Capabilities.batchOrders` */
  placeOrders?(reqs: OrderRequest[]): Promise<OrderAck[]>;
  modifyOrder(id: string, req: Partial<OrderRequest>): Promise<OrderAck>;
  cancelOrder(id: string): Promise<void>;
  cancelAll(marketId?: MarketId): Promise<void>;
  placeTrigger(req: TriggerRequest): Promise<OrderAck>;
  cancelTrigger(id: string): Promise<void>;
  setLeverage(marketId: MarketId, leverage: number, mode: "cross" | "isolated"): Promise<void>;
  setMarginMode(marketId: MarketId, mode: "cross" | "isolated"): Promise<void>;
  /** capability-gated on `Capabilities.orderIdentity === 'derived'` (e.g. pod) */
  deriveOrderId?(req: OrderRequest): string;
}

/**
 * A value or a source of one — every credential prop in a venue factory is
 * typed against this (CORE_SPEC.md §5.4). Static for bots, lazy for
 * storage/vault lookups, reactive for wallets/forms.
 */
export type MaybeSource<T> =
  | T
  | (() => Promise<T | null>)
  | { subscribe(cb: (v: T | null) => void): Unsubscribe };

/**
 * A venue export is one object: market data is always present, account
 * surface activates when `account`'s credential source emits non-null.
 */
export interface Venue<TCred = unknown> {
  id: string;
  market: MarketDataVenue;
  account?: (cred: TCred) => AccountVenue;
}
