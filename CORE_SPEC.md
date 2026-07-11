# @perpetua/core — Engineering Spec v0.1

The headless client + React hooks layer. "viem/wagmi for perps": a typed, framework-agnostic client for perp DEX market data and order lifecycle, with React bindings. No DOM, no CSS, no venue lock-in.

Companion docs: `SPEC.md` (full component inventory), `MODELS.md` (canonical data model + per-venue mapping tables), `tokens/` (theming, not used here).

---

## 1. Goals / Non-goals

**Goals**
- G1: One normalized interface over N perp venues (Hyperliquid first).
- G2: Correctness under adversarial network conditions (gaps, reorders, disconnects, stale feeds). This is the product.
- G3: Decimal-exact numeric handling end to end. No IEEE-754 floats touch a price or size.
- G4: 60fps UI under full-feed load; the client, not the consumer, does the throttling.
- G5: Full TypeScript inference; venue authors get compile errors, not runtime surprises.
- G6: Usable without React (bots, Node, other frameworks) via the client layer.

**Non-goals (v0)**
- Order signing/custody (the venue owns auth; we never hold keys)
- Charting engine (we feed lightweight-charts; we don't render)
- Historical/analytics APIs beyond candle backfill
- Non-perp verticals (interfaces must not preclude them)

## 2. Package structure

viem/wagmi's layering, literally: single-venue client (viem) → desk multiplexer (@wagmi/core) → hooks (wagmi).

```
@perpetua/core            ("our viem" — ONE venue per client)
├─ /client        # createClient({ venue }) — transport, subscription refcounting
├─ /actions       # standalone, tree-shakeable functions: action(client, params)
│   ├─ read:  getMarkets, getBookSnapshot, getCandles, getPositions, getBalances,
│   │         getOrders (history, paginated), getFills (history), getTriggers,
│   │         getFunding, getStats
│   ├─ watch: watchOrderBook, watchTrades, watchCandles, watchMarkPrice,
│   │         watchFunding, watchStats, watchPositions, watchOrders, watchFills,
│   │         watchBalances, watchTriggers, watchAccountHealth, watchLiquidations
│   └─ write: placeOrder, placeOrders (batch, capability-gated), modifyOrder,
│             cancelOrder, cancelAll, placeTrigger, cancelTrigger,
│             setLeverage, setMarginMode
├─ /engines       # internal: BookEngine, BlotterEngine, CandleStitcher
│                 # (watch-actions instantiate these; never imported directly)
├─ /math          # liqPrice, uPnl, marginRequired, tickRound, ... (pure, standalone)
├─ /format        # formatPrice, formatSize, formatDelta, ... (pure, standalone)
├─ /contract      # MarketDataVenue, AccountVenue interfaces — the contract lives in core
└─ /testing       # fixture recorder/replayer + conformance suite (venue packages run it in their tests)

@perpetua/venues      ("our @wagmi/connectors" — root-level, implementations only)
├─ /mock          # deterministic, scriptable — used by all tests
├─ /hyperliquid   # DEX: wraps HL API/SDK into normalized events
├─ /pod           # DEX: pod.network v2 (ob_ JSON-RPC) — batch-auction, poll-based
├─ /binance       # CEX: USD-M futures — apiKey credentials, diff book stream + listenKey
│                 # user stream; browser mode requires proxyUrl (see §5.4), server mode signs direct
└─ (third parties ship their own packages against core's contract: `perpetua-venue-aster`)

@perpetua/desk            ("our @wagmi/core" — ties venues together, no React)
├─ createDesk({ venues })   # venues in — desk creates its clients internally
│                           # (wagmi-style; `clients` override as escape hatch)
├─ sessions       # derived state: each venue follows its own credential prop
│                 # (wallet: / apiKey: / signer:, value or source) — no connect() API
├─ routing        # MarketId prefix → owning client; desk actions mirror core actions
├─ merge          # MarketList union, cross-venue blotter union, per-venue health map
└─ (a desk with one venue adds ~nothing — single-venue apps still use it for the provider)

@perpetua/react           ("our wagmi" — peer dep: react >= 18), two subpath entries:
├─ /hooks         # import { useOrderBook } from '@perpetua/react/hooks'
│                 # thin 1:1 wrappers over core actions; zero component code pulled in
└─ /components    # import { OrderBook } from '@perpetua/react/components'
    ├─ primitives   # unstyled, data-free: NumericInput, FlashCell, DataTable, SideToggle…
    └─ widgets      # connected: OrderBook, OrderEntryPanel, PositionsTable… (built on /hooks)

@perpetua/theme   # CSS only, no JS: tokens.css, tokens.json, tailwind preset, MUI bridge
```

**Dependency rule (one-way, enforced in CI):** `components/widgets → components/primitives + hooks → desk → core` and `venues → core (contract only)`. Never the reverse; hooks import nothing from components; core knows nothing about desks or venue implementations — it defines the contract, venues fulfill it.

**Packaging:** subpath `exports` in package.json + `sideEffects: false`, so `@perpetua/react/hooks` consumers never bundle a component and vice versa (primitives are usable with your own state instead of our hooks). The bare `@perpetua/react` root re-exports both for convenience. Components reference `--pt-*` variables for optional theming but ship unstyled; `@perpetua/theme` is pure CSS artifacts.

**Action conventions** (mirroring viem):
- `get*(client, params)` — one-shot, returns `Promise<T>`
- `watch*(client, { ...params, onUpdate })` — streaming, returns `Unsubscribe`; internally spins up the relevant engine and shares it via the subscription manager
- writes (`placeOrder`, ...) — `Promise<Ack>`, typed errors
- Every action is importable standalone and tree-shakes independently; nothing hangs off a client god-object

```ts
import { createClient, watchOrderBook, placeOrder } from '@perpetua/core';

const client = createClient({ venue: hyperliquid() });   // one venue — viem-style
const markets = await getMarkets(client);
const eth = markets.find({ symbol: 'ETH-PERP', venue: 'hyperliquid' })!.id;  // resolve once

const unwatch = watchOrderBook(client, {
  marketId: eth, grouping: dec('0.5'),
  onUpdate: (book) => render(book),   // same state shape useOrderBook returns
});
```

ESM-only, tree-shakeable, zero runtime deps: the decimal engine is a hand-rolled scaled-bigint, internal-only (never in the public type surface). See §3, §12.

## 3. Numeric policy

- Public boundary: every price/size crosses the public API as a decimal `string` (wire-native, exact, JSON/state-safe) — never a `number`, never a custom decimal type. Consumers display, store, and serialize it directly; the `/math` helpers (string-in/string-out) cover the arithmetic.
- Exact arithmetic is internal-only: strings are parsed to an opaque decimal at the venue boundary, computed with a decimal library inside `/engines`, `/math`, `/format`, and serialized back to `string` before leaving. No IEEE-754 float ever touches a price or size (G3). The decimal type is never exported, so the impl (§12) stays swappable.
- `number` appears only in ratios explicitly marked lossy (`spreadPct`, `imbalance`, `roe`, `impactPct`, chart coords).
- All rounding is explicit: `tickRound(price, market, 'down'|'up'|'nearest')`, `lotRound(size, market, mode)`. No implicit rounding anywhere.
- Formatters return structured parts (`{ sign, int, frac, unit }`) so UIs can style pieces independently.

## 4. Venue contract (`@perpetua/core/contract`)

All identifiers are the opaque `MarketId` from MODELS.md — never display symbols. Resolution of `"ETH-PERP"` → `MarketId` happens once via `getMarkets`.

```ts
interface MarketDataVenue {
  readonly id: string;                    // 'hyperliquid'
  capabilities(): Capabilities;           // see MODELS.md
  markets(): Promise<Market[]>;
  subscribe(sub: Subscription, sink: EventSink): Unsubscribe;
  fetchBookSnapshot(marketId: MarketId): Promise<BookEvent & { type: 'snapshot' }>;
  fetchCandles(marketId: MarketId, resolution: Resolution, range: Range): Promise<Candle[]>;
}

type Subscription =
  | { kind: 'book'; marketId: MarketId }
  | { kind: 'trades'; marketId: MarketId }
  | { kind: 'candle'; marketId: MarketId; resolution: Resolution }
  | { kind: 'markPrice' | 'indexPrice' | 'funding' | 'stats'; marketId: MarketId }
  | { kind: 'liquidations' };

// Venues emit normalized events; ordering/gap handling is the ENGINE's job,
// but venues must pass through sequence info when the venue provides it.
// BookEvent, LevelDelta (venue input) and LevelFlash (engine output) are
// defined in MODELS.md — one definition, both docs reference it.
```

```ts
interface AccountVenue {
  // live streams
  positions(sink): Unsubscribe;
  orders(sink): Unsubscribe;
  fills(sink): Unsubscribe;
  balances(sink): Unsubscribe;
  triggers(sink): Unsubscribe;                        // TP/SL — pod: ob_getTriggers poll · HL: order stream filter
  // history (paginated behind a uniform cursor; per-venue pagination hidden here)
  fetchOrders(q: HistoryQuery): Promise<Page<Order>>;
  fetchFills(q: HistoryQuery): Promise<Page<Fill>>;
  // writes
  placeOrder(req: OrderRequest): Promise<OrderAck>;   // venue attaches builder code
  placeOrders?(reqs: OrderRequest[]): Promise<OrderAck[]>;  // batch, capability-gated
  modifyOrder(id: OrderId, req: Partial<OrderRequest>): Promise<OrderAck>;
  cancelOrder(id: OrderId): Promise<void>;
  cancelAll(marketId?: MarketId): Promise<void>;
  placeTrigger(req: TriggerRequest): Promise<OrderAck>;
  cancelTrigger(id: string): Promise<void>;
  setLeverage(marketId, leverage, mode): Promise<void>;
  deriveOrderId?(req: OrderRequest): string;          // orderIdentity: 'derived' (pod)
}
```

**Conformance suite** (`/testing`): every venue must pass a recorded-fixture test battery (see §9) before it ships. This is the moat-maintenance mechanism.

### 4.1 Venue profiles

Capabilities exist because venues differ structurally, not just cosmetically. The two launch venues are deliberately opposite:

| | Hyperliquid (DEX) | pod.network v2 (DEX) | Binance USD-M (CEX) |
|---|---|---|---|
| Matching | continuous CLOB | **frequent batch auction** (`auction_interval` µs per round; one clearing price per batch) | continuous CLOB |
| Book feed | websocket snapshot + diffs | **poll `ob_getOrderbook`** — no ws deltas, no seq numbers documented | ws diffs + REST snapshot, sequence ids (`U`/`u`) — the classic reconciliation case |
| Public trades tape | yes | **none** — derive prints from candles/batch clearing prices; per-account fills via `ob_getFills` | yes (aggTrades) |
| Timestamps | ms | **microseconds, everywhere** | ms |
| Numbers | decimal strings | 1e18-scaled hex (`HexUint256`), signed decimal strings for PnL/funding/sizes, decimal-string map keys for book levels | decimal strings |
| Book granularity | per-level | pre-aggregated by `grouping_precision` | per-level |
| Credentials | wallet (`typedData`) | wallet (`transaction`) | **`apiKey`** (HMAC); browser needs proxy, server signs direct |
| Account stream | ws | poll | **listenKey** user-data stream (keepalive lifecycle owned by venue package) |
| Extras | funding, OI | native TP/SL triggers, positions w/ PnL, funding, oracle+mark, leaderboard (`ob_getRankedPositions`) | rate-limit weights per endpoint (venue tracks budget), dual-side position mode |

The full `Capabilities` interface lives in MODELS.md (single definition): `matching`, `bookFeed`, `sequenceNumbers`, `publicTape`, `candleResolutions`, `nativeTriggers`, `nativeTwap`, `orderIdentity`, `batchOrders`, `tifs`, `marketTypes`, `auctionIntervalUs?`, `signerKind`.

**pod venue design notes** (from the [ob_ reference](https://docs.v2.pod.network/guides-references/references/json-rpc/orderbook-data-ob.md)):
- Poll cadence = one `ob_getOrderbook` per `auction_interval`; BookEngine clause 3 (no-seq fallback) applies. `timestamp` + `new_orders_count` + `buys_count`/`sells_count` are the staleness/change signals.
- Batch auctions surface in the UI contract: `useOrderBook` gains `nextAuctionIn` and `clearingPrice` fields (null on continuous venues) — an auction-countdown widget is a pod-native differentiator.
- `useTradesFeed` on pod: capability-degraded mode synthesizes prints from batch clearing prices; components must render gracefully with `publicTape: false`.
- Encoding shims: `HexUint256` (1e18) → decimal `string`; signed decimal strings → normalized decimal `string`; µs → ms normalization at the venue boundary. All three conversions live only in the venue.
- Pagination is per-method (cursor formats differ; `ob_getFills` is time-windowed, max 500, `to_ts` exclusive) — hidden behind the venue.
- Open questions: websocket/`eth_subscribe` availability (overview mentions eth-layer subscriptions; whether book events are derivable from orderbook-precompile logs needs testing), mainnet URL and rate limits (only `https://rpc.podtestnet.dev/` is documented).

## 5. Client, provider, and multi-venue

### 5.1 Client (viem layer) and desk (wagmi layer)

A **client** is bound to exactly one venue — like a viem client is bound to one chain. A **desk** ties N venues into one surface — and, like wagmi's `createConfig`, it **creates its clients internally**: you hand it venues, not clients.

```ts
import { createDesk } from '@perpetua/desk';
import { hyperliquid } from '@perpetua/venues/hyperliquid';
import { pod } from '@perpetua/venues/pod';

const desk = createDesk({
  venues: [
    hyperliquid({ builderCode: '0x…', wallet: fromWagmi(wagmiConfig) }),   // follows wagmi reactively
    pod({ rpcUrl: 'https://rpc.podtestnet.dev', wallet: fromWagmi(wagmiConfig) }),
  ],
  options: { staleAfter: 5_000, frameBudget: 16, reconnect: { minMs: 500, maxMs: 30_000, jitter: true } },
});

desk.getClient('hyperliquid');      // reach the underlying viem-layer client when needed
```

Accounts need no imperative wiring: each venue follows its credential prop's source (§5.4) — when it emits a value the session activates, when it emits null it tears down. Each venue package bundles its own account module; the venue export is one object (the credential type is the venue's own — `WalletClient` for DEXes, `ApiKey` for CEXes):

```ts
interface Venue<TCred = unknown> {
  id: string;
  market: MarketDataVenue;
  account?: (cred: TCred) => AccountVenue;  // invoked by the venue when its credential source emits
}
```

Widgets and hooks degrade automatically while a venue has no session: `usePositions()` reports the venue as `disconnected`, `OrderEntryPanel` renders its connect prompt.

Escape hatch (wagmi's `client` option, same idea): pass a pre-built client for a venue that needs custom construction — `createDesk({ venues: […], clients: [myTunedHlClient] })` — desk uses yours instead of constructing one. Building a bare `createClient({ venue })` from `@perpetua/core` directly remains the bot/single-venue-script path.

- The **client** owns transport and lifecycle for its one venue: connection or poll loop, `SubscriptionManager` refcounting (N consumers of one market share one stream, unsubscribed 5s after the last consumer leaves), engines. Core actions (`watchOrderBook(client, …)`) work on a bare client — no desk required.
- The **desk** owns client construction/teardown plus everything cross-venue; it holds no transport of its own. Desk actions mirror core actions 1:1 (`watchOrderBook(desk, …)`) and delegate to the owning client. `desk.destroy()` tears down all clients it created (never ones passed in). One `options` bag applies to all constructed clients, per-venue overridable.

### 5.2 Multi-venue routing (desk)

`MarketId` is globally unique and venue-qualified: `"{venueId}:{venueLocalId}"` — `"hyperliquid:ETH"`, `"pod:0x3f…"`. Because the venue travels inside the id, **desk actions need no venue parameter**: `watchOrderBook(desk, { marketId })` routes to the owning client by prefix. `getMarkets(desk)` returns the union across venues as an indexed collection:

```ts
interface MarketList {
  all: Market[];                                  // merged, stable order (venue, then symbol)
  byId(id: MarketId): Market | undefined;         // exact
  bySymbol(symbol: string): Market[];             // 0..n — two venues may list "ETH-PERP"
  find(q: { symbol: string; venue?: string }): Market | undefined;  // unique or undefined, never a guess
  byVenue(venueId: string): Market[];
}
```

`bySymbol` deliberately returns an array — symbol collisions across venues are resolved by the caller (or via `find` with `venue`), never silently by us. Per-venue failures degrade partially: markets from healthy venues return, failed venues surface in `useMarkets().status`.

**Latency semantics:** the awaited `getMarkets(client)` resolves when all venues answer or time out — it is as slow as the slowest venue (bounded by `timeoutMs`). UI code should use the progressive path instead: `watchMarkets` / `useMarkets` emit incrementally — fast venues' markets appear immediately, slow venues append when they arrive, `status` is per venue (`Record<venueId, 'loading' | 'ready' | 'error'>`). A market selector must never be blocked by the slowest configured venue. This is wagmi's chainId pattern, but carried by the identifier instead of a separate argument, so components composing over mixed-venue watchlists stay venue-unaware. One engine instance per (marketId, grouping) regardless of how many consumers watch it.

Account state across venues: `usePositions`/`useOpenOrders` return the merged union (rows carry their marketId, hence venue). `useAccountHealth` is **per venue** — margin does not cross venues, so health is `Record<venueId, AccountHealth>`; blending them into one number would be dangerously wrong.

### 5.3 React provider & SSR

```tsx
import { PerpetuaProvider } from '@perpetua/react';

<PerpetuaProvider desk={desk}>
  <App />
</PerpetuaProvider>
```

- The provider takes a **desk** (wrap a single client in `createDesk({ clients: [hl] })` — identical wiring at N=1). Hooks read the desk from context; every hook also accepts an optional `{ desk }` override (escape hatch, multi-desk apps, tests). Providers are nestable; nearest wins.
- The provider is exported from the package root (not `/hooks` or `/components`) so both subpaths share one context.
- **SSR position (v0): no data on the server.** Hooks are `useSyncExternalStore` bindings whose `getServerSnapshot` returns the deterministic empty state (`status: 'connecting'`, empty arrays, null prices). No fetching, no hydration mismatch, works in Next.js App Router out of the box. Server-side snapshot pre-fetching is explicitly deferred (candles are the only plausible candidate and lightweight-charts is client-only anyway).

### 5.4 Venue-natural credential props

There is no generic "auth" abstraction and no `Credentials` union in the public API. **Each venue factory declares the credential prop it naturally needs, with its natural type** — DEXes need a wallet, CEXes need keys:

```ts
// every credential prop accepts a value OR a source of one:
type MaybeSource<T> =
  | T                                                   // static — bots, server-side
  | (() => Promise<T | null>)                           // lazy — storage/vault lookup
  | { subscribe(cb: (v: T | null) => void): Unsubscribe };  // reactive — wallets, forms

const keys = store<ApiKey>({ persist: 'session' });    // writable reactive source

const desk = createDesk({
  venues: [
    hyperliquid({ builderCode: '0x…', wallet: fromWagmi(wagmiConfig) }),  // wallet: MaybeSource<WalletClient>
    pod({ wallet: fromWagmi(wagmiConfig) }),            // same source → shared wallet
    binance({ apiKey: keys }),                          // apiKey: MaybeSource<ApiKey>
    // institutional alternative — secrets stay server-side:
    // binance({ signer: remoteSigner({ endpoint: '/api/sign' }) })
  ],
});
```

Semantics:
- **Typed per venue, checked at compile time.** `hyperliquid({ apiKey })` doesn't typecheck; there are no runtime kind-matching rules because the type system did the matching. Scoping is structural — keys are attached to their venue by construction.
- A session is **derived state**: the prop's source emits a value → the venue's account surface activates; emits `null` → teardown. Disconnect, account switching, and key rotation are all just emissions. `useAccount()` reads `{ sessions, byVenue }`; there is no connect/disconnect API to learn.
- **Wallets:** `fromWagmi(config)` subscribes to the app's existing wagmi state — RainbowKit's connect button is the connect button; Perpetua follows, never prompts. Bots pass a viem `WalletClient` directly.
- **CEX:** `apiKey` for local HMAC (bots, server-side), `signer: remoteSigner(…)` for browsers/institutions — requests are signed by the app's backend and the secret never reaches the page.
- Perpetua never persists credentials itself; `store({ persist })` is explicit, opt-in, and app-controlled.

**Credentials vs sessions — venue-owned derivation.** What the app supplies is the *root* credential; the *operating* auth is often derived from it by a venue-specific protocol, and that derivation belongs to the venue package, never the app:

| Venue | Root credential (its prop) | Derived operating session |
|---|---|---|
| Hyperliquid | `wallet: WalletClient` | **agent wallet**: venue generates a keypair, user signs one `approveAgent` action, agent key signs all subsequent orders — no per-order wallet popups |
| Binance | `apiKey: ApiKey` (or `signer`) | **listenKey** user-data stream, keepalive/rotation owned by the venue |
| pod | `wallet: WalletClient` | used directly — identity is the session |

Consequences:
- Session lifecycle states are first-class: `useAccount()` sessions report `authorizing` (e.g. waiting for the one approveAgent signature) between `disconnected` and `connected`; widgets can render "Approve trading" as a distinct prompt from "Connect wallet".
- Derived keys have policies, set on the venue factory: `hyperliquid({ auth, agent: { persist: 'session' | 'memory', ttl } })`. Persisted agent keys are what make "reload the page, still trading" work; `memory` is the conservative default.
- Root source emitting `null` (wallet disconnect) revokes/tears down the derived session. Root emitting a *different* address invalidates and re-derives.
- This is a major hidden-plumbing sell: every HL terminal hand-rolls the agent-wallet flow today. With Perpetua it's `auth: fromWagmi(config)` and the venue does the rest.

Persona map: bot = static credentials inline; DEX app = `fromWagmi`, zero connection code; product team = `credentialStore` + their settings form; institution = `remoteSigner` against their signing service. Identical widgets and account state for all four.

### 5.5 Venue isolation & backpressure

A slow venue must never degrade a fast one. Enforced by construction:
- Each venue owns its transport and scheduling — no shared queue between venues. pod's poll loop stalling has no path to HL's websocket handling.
- Slowness surfaces as per-venue state (`status: 'stale'`, `useConnection().latencyMs`), never as blocking. Merged reads (`getMarkets`) are allSettled: healthy venues return, sick ones report.
- Backpressure (rate-limit backoff, poll degradation) is scoped to the offending venue.
- No cross-venue joins exist in any hot path; the merged blotter is event-driven union, not a synchronized join.
- Conformance suite includes a "sick venue" scenario: one venue delayed 10s / erroring, assert the other's book emissions are unaffected.

**Main-thread scaling path:** the actual bottleneck is a *fast* venue competing with React for CPU. Engines are pure, DOM-free state machines, so they are Web Worker-hostable by design: venue parsing + book maintenance in a worker, coalesced `BookState` posted to the main thread. Not built in v0, but no engine may take a dependency that would preclude it (CI check: engines import nothing from `/client` or DOM types).

### 5.6 Actions and engines

- Actions are the public API. Watch-actions instantiate engines lazily and share them: two `watchOrderBook` calls for the same marketId+grouping share one engine instance.
- All engines are pure state machines fed by venue events; unit-testable without any network. They are internal — consumers touch them only through actions.

### BookEngine behavioral contract (the useOrderBook core)
1. Diffs arriving before snapshot are buffered; applied in seq order after snapshot lands.
2. Seq gap detected → state `resyncing`, snapshot re-requested, buffered diffs replayed. Never render a book known to be wrong.
3. Venues without seq numbers (capability flag): fall back to checksum if offered, else periodic snapshot refresh (configurable, default 30s).
4. Grouping is a derived view over raw levels — changing grouping never re-subscribes and completes in < 1ms for a 5k-level book.
5. Emits per-level `LevelFlash` tags (`{ price, side, dir: 'up'|'down'|'new'|'gone' }`) for flash animations.
6. No heartbeat/message for `staleAfter` (default 5s) → state `stale`. Consumers must be able to grey out a dead book.
7. Output is coalesced: at most one emission per `frameBudget` (default 16ms), latest-wins.

### CandleStitcher contract
- REST backfill + live stream merged with no gap and no double-count at the seam (test fixture covers the boundary candle exactly).
- Interval switch reuses cache where derivable (1m → 5m aggregates locally).

### BlotterEngine contract
- Optimistic insert is **capability-gated**, never assumed. `Capabilities.orderIdentity` selects the strategy:
  - `'clientId'` (HL cloid): optimistic insert keyed by client-generated id, reconciled on ack.
  - `'derived'` (pod: `order_id = keccak(signer, nonce, sequence)`, and we choose the nonce): venue implements `deriveOrderId(req)`; optimistic insert keyed by the precomputed venue id — same UX as clientId with zero venue support.
  - `'none'`: no optimistic row; the order first appears on the venue's own event. `useOrderEntry` still reports `submitting → acked` from the write promise, so the ticket UX is unaffected — only the blotter waits for truth.
- Must handle: fill arriving before ack; cancel-ack for an order never acked; duplicate fills (idempotent by fill id).
- Order state machine: `pending → open → partiallyFilled → filled | cancelled | rejected | expired` — no other transitions representable. `expired` is reachable only on venues with deadline orders (`tifs` includes `GTT`, e.g. pod); the engine treats it as terminal, like `cancelled` but venue-initiated.

## 6. React hooks layer (`@perpetua/react/hooks`)

Thin bindings, wagmi-style: each hook is a 1:1 wrapper over a **desk action** (`useOrderBook` = `watchOrderBook(desk, …)` + `useSyncExternalStore`). No hook contains domain logic — all logic lives in engines (core) and routing/merging (desk); React is just another consumer. Anything achievable with a hook is achievable without React via the underlying desk or core action.

| Hook | Returns (abridged) | Notes |
|---|---|---|
| `useMarkets()` | `{ markets, byId, status }` | metadata foundation; everything reads tick/lot from here |
| `useOrderBook(marketId, opts)` | `{ bids, asks, mid, spread, spreadPct, imbalance, status, changes }` | opts: `grouping: string`, `depth`, `frameBudget` |
| `useTradesFeed(marketId, opts)` | `{ trades, status }` | ring buffer, `maxRows` default 200 |
| `useCandles(marketId, resolution)` | `{ candles, live, status }` | feeds lightweight-charts directly |
| `useMarkPrice / useIndexPrice` | `{ price, ts, stale }` | |
| `useFunding(marketId)` | `{ rate, predicted, nextAt, countdown }` | normalized sign: positive = longs pay |
| `useMarketStats(marketId)` | `{ vol24h, high, low, change, oi }` | |
| `useLiquidationsFeed()` | `{ events }` | |
| `usePositions()` | `{ positions, totals }` | uPnL/ROE/liq derived in engine, consistent w/ mark ticks |
| `useOpenOrders / useFills / useOrderHistory` | blotter rows | |
| `useBalances()` | per-asset, withdrawable vs locked | |
| `useAccountHealth()` | `{ ratio, band: 'safe'|'warn'|'danger', distanceToLiq }` | threshold events fire on band change |
| `useOrderEntry(market)` | statechart — see SPEC.md §Layer 0 | built last (M4) |
| `useConnection()` | `{ status, latencyMs, lastMsgAt }` per venue | socket health, not wallet |
| `useAccount()` | `{ sessions, byVenue }` | derived from venues' auth sources; no connect/disconnect hooks — wallets use wagmi's own, CEX forms write to `credentialStore` |
| `useKeyboardTrading(bindings)` | armed/confirm safety layer | v0.2 |

## 7. Error & state model

- Every subscription-backed hook exposes `status: 'connecting' | 'live' | 'stale' | 'resyncing' | 'error'`.
- Errors are typed: `VenueError | SequenceGapError | ValidationError | OrderRejectedError(venueReason) | RateLimitError(retryAfterMs?) | TimeoutError`. Venue reject strings are mapped to a normalized enum + original preserved.
- Reconnect (push venues): exponential backoff (0.5s → 30s cap, jittered), resubscribe-all on reconnect, books resync automatically.
- **Poll-mode policy (pod-style venues):** polls never overlap (next poll schedules only after the previous settles); on `RateLimitError` the poll cadence backs off multiplicatively (×2 up to 8× `auctionInterval`) and recovers gradually, honoring `retryAfterMs` when provided; consecutive failures degrade `status` to `stale`, not `error` — `error` is reserved for non-transient failures. Status must never flap on a single missed poll.
- All `get*` actions take an optional `timeoutMs` (default 10s) and reject with `TimeoutError`.

## 8. Performance budgets (CI-enforced)

- BookEngine: apply 10k diffs/sec on a 5k-level book with p99 apply < 0.5ms (Node bench).
- Hook emission: ≤ 1 per frame budget under any input rate.
- TradesFeed: zero allocation growth over 1M events (ring buffer reuse).
- Bundle: client core ≤ 25kb gz; each hook tree-shakes independently.

## 9. Testing strategy

1. **Recorded fixtures**: capture real venue websocket sessions (volatile + quiet periods) into replayable fixture files. Deterministic replay through engines; snapshot-test outputs.
2. **Adversarial suite**: programmatic gap injection, reorder, duplicate, disconnect-mid-snapshot, stale heartbeat — every BookEngine contract clause (§5) has a named test.
3. **Venue conformance**: same suite runs against any venue via mock transport; passing it is the bar for a `@perpetua/venue-*` release.
4. **Property tests**: book invariants (bids strictly descending, asks ascending, no crossed book after any event sequence, grouping conserves total size).
5. Live smoke test (CI cron, non-blocking): 60s against real Hyperliquid testnet.

## 10. Milestones

| # | Deliverable | Definition of done |
|---|---|---|
| M0 | Repo scaffold, decimal decision, venue types, mock venue | conformance suite green on mock |
| M1 | BookEngine + `useOrderBook` + `useMarkets` | adversarial suite green; perf budget met |
| M2 | Hyperliquid venue (market data) + `useTradesFeed`, `useCandles`, `useFunding`, `useMarketStats` | conformance green on recorded HL fixtures |
| M3 | **Read-only live terminal demo** (book + trades + chart + ticker on landing page) | runs 24h against HL mainnet feed without desync |
| M4 | Account layer + `useOrderEntry` statechart (HL testnet) | place/cancel/fill round-trip on testnet; blotter reconciliation suite green |
| M5 | pod.network venue (testnet) | conformance green; batch-auction + poll-only + µs/hex encodings all absorbed at the venue boundary — the hardest possible test of the abstraction |
| M6 | Third DEX venue (Lighter or Aster) | conformance green; zero core changes required |
| M7 | Binance USD-M futures venue (CEX profile) | conformance green; apiKey credential flow + proxy transport + listenKey user-stream lifecycle proven; one desk spanning HL + Binance in a single blotter |

M3 is the public proof point. M5 is the architectural proof point: pod is structurally unlike Hyperliquid (batch vs continuous, poll vs push), so if the contract survives it, it survives anything. M6 confirms it cheaply.

## 11. Licensing & repo boundary

Open-core, with the line drawn at composed widgets:

| MIT (public monorepo) | Commercial (`@perpetua/pro`, private repo) |
|---|---|
| `@perpetua/core` (client, actions, engines, math) + `@perpetua/desk` | Connected widgets: `OrderBook`, `OrderEntryPanel`, `PositionsTable`, blotter tables, dialogs |
| `@perpetua/react/hooks` (all hooks) | `PerpsTerminal` / `MobileTerminal` templates + saved layouts |
| `@perpetua/react/components` **primitives only** in OSS | Figma library |
| `@perpetua/theme`, all venues, `/testing` conformance suite | |

Rationale: hooks + primitives are the adoption funnel and the builder-code carrier (the free tier still monetizes via default builder codes); widgets are what teams would pay to skip. `@perpetua/pro` depends only on public APIs of the MIT packages — it's a customer of its own platform, which keeps the OSS boundary honest. Consequence for M0: two repos from day one; the public monorepo never contains pro code.

## 12. Open questions

- Internal decimal impl: **resolved — scaled bigint** (signed bigint mantissa + decimal scale; add/sub/mul exact, div to 20 dp half-up). Chosen for native-primitive speed over big.js's digit-array math; zero runtime deps. Purely internal — the public boundary is `string` (§3), so it stays swappable without a breaking change. M0 BookEngine bench may still revisit.
- Builder-code attachment point: venue config vs client config (leaning venue — it's venue-specific; pod's equivalent mechanism TBD).
- Framework bindings beyond React (Vue/Svelte) — client layer makes them cheap; defer until asked.
- Server-side candle prefetch for SSR — deferred (see §5.3).
- pod websocket/`eth_subscribe` book events via orderbook-precompile logs — testnet experiment in M5.
