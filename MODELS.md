# Perpetua — Canonical Data Model v0.1

The normalized types every engine, action, and hook speaks. Wire formats (HL decimal strings, pod 1e18 hex / signed strings / µs) die at the venue boundary; nothing below ever contains a venue encoding.

Design rules:
1. **Superset with nullables** — fields some venues lack are `null`, and `Capabilities` explains *why*, so UIs degrade deliberately.
2. **Explicit over conventional** — no signed sizes, no implied sides, no venue sign conventions. `side` is always an enum; sizes are always positive decimal strings.
3. **Typed extension bag** — irreducibly venue-specific data lives in `ext`, typed per venue via declaration merging, never `any`.
4. **Every mapping is a fixture test** — the per-venue mapping tables at the bottom are executable claims.

```ts
// ───────────────────────────── primitives ─────────────────────────────

// Prices and sizes are decimal `string` (wire-native, exact, JSON/state-safe).
// Exact arithmetic is internal-only (big.js-backed, CORE_SPEC.md §3/§12); no
// float ever touches a price or size. Consumers use the `/math` helpers
// (string-in/string-out) when they need arithmetic.

/** Milliseconds. Venue implementations downscale µs wire formats (pod); sub-ms precision, if needed, goes in ext. */
type Ts = number;

/** Venue-scoped opaque id. HL: "ETH". pod: 0x-prefixed 32-byte orderbook_id.
 *  Never parsed, never displayed — display comes from Market fields. */
type MarketId = string & { readonly __brand: 'MarketId' };

type Side = 'buy' | 'sell';
type PositionSide = 'long' | 'short';

// ───────────────────────────── capabilities ─────────────────────────────

interface Capabilities {
  matching: 'continuous' | 'batchAuction';
  bookFeed: 'diff' | 'pushSnapshot' | 'pollSnapshot'; // HL: pushSnapshot · pod: pollSnapshot · Binance-style: diff
  sequenceNumbers: boolean;
  publicTape: boolean;            // pod: false → synthetic prints
  candleResolutions: Resolution[];
  nativeTriggers: boolean;        // venue-side TP/SL
  nativeTwap: boolean;
  orderIdentity: 'clientId' | 'derived' | 'none';  // HL: clientId · pod: derived (keccak of signer/nonce/seq)
  batchOrders: boolean;           // placeOrders support
  tifs: Tif[];                    // what the venue accepts
  marketTypes: ('perp' | 'spot')[];
  auctionIntervalUs?: number;     // batchAuction only
  credential: 'wallet' | 'apiKey' | null;   // descriptive metadata for UIs ("needs a wallet" vs
                                            // "needs keys"); null = read-only venue. The actual
                                            // credential TYPE is each venue factory's own typed prop.
}

// ───────────────────────────── market ─────────────────────────────

interface Market {
  id: MarketId;
  symbol: string;                 // display: "ETH-PERP", "NVDAx/USD"
  base: string; quote: string;    // display symbols
  type: 'perp' | 'spot';
  tickSize: string;                  // all rounding derives from these two
  lotSize: string;
  minNotional: string | null;
  maxLeverage: number | null;     // perp only
  makerFee: string; takerFee: string;   // rates; pod puts fees here, not on fills
  ext?: MarketExt;                // e.g. ext.pod.auctionInterval, ext.pod.tokenAddresses
}

// ───────────────────────────── order book ─────────────────────────────

interface BookLevel {
  price: string;
  size: string;                      // base units, always positive
  orderCount: number | null;      // HL: n · pod: null (pre-aggregated)
  minExpiry: Ts | null;           // pod: minimum_expiry · HL: null
}

interface BookState {
  marketId: MarketId;
  bids: BookLevel[];              // desc — engine re-sorts, never trusts wire order
  asks: BookLevel[];              // asc
  mid: string | null; spread: string | null; spreadPct: number | null;
  imbalance: number | null;       // lossy ratio, number is fine
  grouping: string;                  // client-side grouping currently applied
  status: 'connecting' | 'live' | 'stale' | 'resyncing' | 'error';
  ts: Ts;
  changes: LevelFlash[];          // per-emission flash tags (engine output, for FlashCell)
  // batch-auction venues only (null on continuous):
  clearingPrice: string | null;
  nextAuctionIn: number | null;   // ms until next matching round
}

/** Engine OUTPUT: which rendered levels changed, for flash animations. */
type LevelFlash = { price: string; side: Side; dir: 'up' | 'down' | 'new' | 'gone' };

/** Venue INPUT: a raw level mutation on the wire. size 0 = remove level. */
type LevelDelta = { side: Side; price: string; size: string };

/** Venue → engine events. The engine, not the venue, owns ordering/gap logic. */
type BookEvent =
  | { type: 'snapshot'; seq?: number; bids: BookLevel[]; asks: BookLevel[]; ts: Ts }
  | { type: 'diff'; seq?: number; deltas: LevelDelta[]; ts: Ts };

// ───────────────────────────── trades / candles ─────────────────────────────

interface Trade {
  id: string;
  marketId: MarketId;
  price: string; size: string;
  side: Side | null;              // aggressor; null when venue doesn't attribute
  ts: Ts;
  synthetic: boolean;             // pod: true — derived from batch clearing price
}

/** Canonical superset — venues declare support via capabilities().candleResolutions.
 *  (pod: 1m,5m,15m,1h,4h,1d · HL adds 3m,30m,2h,8h,12h,1w,1M.)
 *  CandleStitcher may derive an unsupported resolution by aggregating a finer one. */
type Resolution =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '8h' | '12h'
  | '1d' | '1w' | '1M';

interface Candle {
  ts: Ts;                         // open time; engine normalizes newest-first venues (pod) to asc
  open: string; high: string; low: string; close: string; volume: string;
  closed: boolean;                // false = live partial candle
}

// ───────────────────────────── pricing / funding ─────────────────────────────

interface Prices {
  mark: string | null; index: string | null; oracle: string | null;
  ts: Ts; stale: boolean;
}

interface Funding {
  rate: string;                      // normalized sign: POSITIVE = longs pay shorts, on all venues
  predicted: string | null;          // HL: yes · pod: null
  nextAt: Ts | null;              // HL: yes · pod: null (per-batch accrual)
  indexCum: string | null;           // pod: funding_index · HL: null
  intervalUs: number | null;
  ts: Ts;
}

interface MarketStats {
  vol24h: string; high24h: string; low24h: string;
  change24hPct: number;
  openInterest: string | null;       // quote notional
  lastPrice: string;
  ts: Ts;
}

// ───────────────────────────── orders / fills ─────────────────────────────

type OrderType = 'market' | 'limit' | 'stopMarket' | 'stopLimit' | 'twap';
type Tif = 'GTC' | 'IOC' | 'FOK' | 'ALO' | 'GTT';   // ALO: HL post-only · GTT: pod deadline model
type OrderStatus =
  | 'pending'      // sent/acked, not yet resting (pod: pending; HL optimistic state)
  | 'open'
  | 'partiallyFilled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';     // pod GTT deadline passed; HL: unused

interface Order {
  id: string;                     // venue order id (pod: keccak hash)
  clientId: string | null;        // HL cloid · pod: null (capability-gated optimism)
  marketId: MarketId;
  side: Side;                     // derived from pod signed initial_size at boundary
  type: OrderType;
  status: OrderStatus;
  price: string | null;              // null for market orders
  size: string;                      // original, positive, base units
  filled: string;                    // base units
  avgFillPrice: string | null;       // pod: effective_price
  tif: Tif;
  reduceOnly: boolean;
  origin: 'user' | 'engine';      // engine = venue-generated: liquidation, fired trigger (pod kind)
  expiresAt: Ts | null;           // GTT only
  createdAt: Ts; updatedAt: Ts;
  ext?: OrderExt;                 // e.g. ext.pod.direction (13-value enum), ext.pod.nonce
}

interface Fill {
  id: string;                     // synthesized if venue lacks one (pod: hash of order_id+ts) — idempotency key
  orderId: string;
  marketId: MarketId;
  side: Side;
  price: string;                     // pod: batch clearing price
  size: string;                      // base
  fee: string | null;                // pod: null (always zero on wire; rates live on Market)
  ts: Ts;
}

// ───────────────────────────── positions / account ─────────────────────────────

type Position = PerpPosition | SpotHolding;  // pod forced the union; spot verticals need it anyway

interface PerpPosition {
  kind: 'perp';
  marketId: MarketId;
  side: PositionSide;
  size: string;                      // positive; side carries direction
  notional: string;
  entryPrice: string; markPrice: string;
  liqPrice: string | null;
  margin: string; leverage: number;
  marginMode: 'cross' | 'isolated' | null;
  uPnl: string; rPnl: string; roe: number;
  fundingAccrued: string | null;     // pod: yes · HL: cumFunding
  tpsl: { tp: string | null; sl: string | null };
}

interface SpotHolding {
  kind: 'spot';
  marketId: MarketId;
  balance: string; free: string; locked: string;
  costBasis: string | null; markPrice: string;
  uPnl: string | null; rPnl: string | null;
}

interface AccountSnapshot {
  positions: Position[];
  equity: string;                    // pod: account_value · HL: accountValue
  cash: string | null;
  withdrawable: string;
  totalUPnl: string; totalRPnl: string;
  marginUsed: string; maintenanceMargin: string;
  health: { ratio: number; band: 'safe' | 'warn' | 'danger' };  // engine-derived, venue-agnostic
  ts: Ts;
}

interface Trigger {                // normalized whether inline (HL) or separate endpoint (pod)
  id: string;
  marketId: MarketId;
  type: 'takeProfit' | 'stopLoss';
  triggerPrice: string;
  limitPrice: string | null;         // null = market on trigger
  size: string; side: Side;
  reduceOnly: boolean;
  ext?: TriggerExt;
}

// ───────────────────────────── extension bag ─────────────────────────────

/** Venues extend these via declaration merging — typed, tree-shaken, never `any`:
 *
 *   declare module '@perpetua/core' {
 *     interface MarketExt { pod?: { auctionIntervalUs: number; baseTokenAddress: string; ... } }
 *     interface OrderExt  { pod?: { direction: PodDirection; nonce: number } }
 *   }
 */
interface MarketExt {} interface OrderExt {} interface TriggerExt {}
```

## Per-venue mapping tables (each row = a conformance fixture)

### Hyperliquid → canonical
| Wire | Canonical |
|---|---|
| coin `"ETH"` | `MarketId("ETH")`, `symbol: "ETH-PERP"` |
| decimal strings `"3412.5"` | decimal `string` (passthrough) |
| ms timestamps | `Ts` passthrough |
| l2Book levels `{px, sz, n}` (pushed full top-N) | `BookEvent{type:'snapshot'}` → `bookFeed: 'pushSnapshot'` |
| trades ws | `Trade{synthetic: false}` |
| ALO (post-only) | `tif: 'ALO'` |
| cloid | `clientId` |
| szi signed position size | `side` + positive `size` |

### pod v2 → canonical
| Wire | Canonical |
|---|---|
| `orderbook_id` Bytes32 | `MarketId(hex)`, `symbol` from `name` |
| `HexUint256` 1e18 | decimal `string` (scale-aware parse) |
| signed decimal strings (pnl, funding, sizes) | decimal `string` + explicit enum where sign was semantic |
| µs timestamps | `Ts` (÷1000); µs kept in `ext` where needed |
| `buys`/`sells` price-keyed maps `{volume, minimum_expiry}` | re-sorted `BookLevel[]`, `minExpiry` populated → `bookFeed: 'pollSnapshot'` |
| no public tape | `Trade{synthetic: true}` from batch clearing price; `publicTape: false` |
| `initial_size` sign | `side: 'buy' | 'sell'` |
| `status: expired` / `deadline` | `OrderStatus 'expired'` / `tif: 'GTT'` + `expiresAt` |
| `kind: liquidation | triggered` | `origin: 'engine'` |
| `direction` (13 values) | `ext.pod.direction` |
| `ob_getTriggers` endpoint | `Trigger[]` (same model as HL inline triggers) |
| candles newest-first, inclusive/inclusive range | re-sorted asc; range semantics hidden in venue |
| `ob_getFills` no-cursor, `to_ts` exclusive, max 500 | windowed backfill inside venue; emits `Fill[]` with synthesized ids |
| spot holdings + perp positions in one response | `Position` union |
| `clearing_price`, `auction_interval` | `BookState.clearingPrice`, `nextAuctionIn`, `Capabilities.auctionIntervalUs` |

## Invariants (property-tested)
- No crossed book after any event sequence: `max(bids.price) < min(asks.price)` whenever both non-empty.
- Bids strictly descending, asks strictly ascending, no duplicate prices.
- Grouping conserves total size per side.
- `Order.filled ≤ Order.size`; `status: filled ⇔ filled = size`.
- Fill application is idempotent by `Fill.id`.
- All price/size fields round-trip `format → parse` losslessly at market precision.
