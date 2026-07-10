# Perpetua — Foundational Widgets for Pro Trading Software

> Working name "Perpetua". Headless trading logic + unstyled primitives + a token-driven theme layer. Perps-first, with primitives shared by swap, DEX, and prediction-market interfaces.

## Architecture

Three packages, strictly layered. Each layer is usable without the one above it.

| Package | Ecosystem analogue | What it is | Depends on |
|---|---|---|---|
| `@perpetua/core` | viem | Single-venue client, actions, engines, math, venue *contract*. No DOM, no CSS, no React. | nothing |
| `@perpetua/venues` | @wagmi/connectors | Venue implementations: mock, hyperliquid, pod. Third parties ship their own against core's contract. | core |
| `@perpetua/desk` | @wagmi/core | Ties N clients together: MarketId routing, merged markets/blotter, per-venue health. Framework-agnostic. | core |
| `@perpetua/react` | wagmi | Two subpath entries: `/hooks` (1:1 wrappers over desk actions) and `/components` (unstyled primitives + connected widgets, Radix-style, data-attributes for state). Hooks usable without components; primitives usable without hooks. | desk (peer: react) |
| `@perpetua/theme` | — | Pure CSS artifacts: design tokens, Tailwind preset, MUI bridge. Swappable for any styling system. | nothing (styles `--pt-*` vars the components reference) |

Data enters through **venue interfaces**, never hard-coded integrations. Teams plug in their own exchange/chain venues; we ship reference venues: `mock` (deterministic, for tests), `hyperliquid` (continuous CLOB, push feeds), and `pod` (batch auction, poll feeds).

The venue contract (unified `subscribe(sub, sink)`, capability flags, normalized events) is defined once in **CORE_SPEC.md §4** and the canonical types it speaks in **MODELS.md** — not duplicated here.

---

## Layer 0 — Headless core (`@perpetua/core`)

The defensible layer. All numeric logic is decimal-safe (no float math on prices/sizes).

### Positioning: "the viem/wagmi of perps"
Two sub-layers, mirroring viem (transport + actions) and wagmi (React hooks):
- **Client** — framework-agnostic: venues, book engine, decimal math, order lifecycle. Usable from Node, bots, or any UI framework.
- **Hooks** — React bindings over the client. Everything below ships in both forms where sensible.

### Market data hooks
- `useMarkets(venue)` — market list + metadata (tick size, lot size, max leverage, funding interval). **Build first: all rounding and validation reads from this.**
- `useOrderBook(venue, symbol, opts)` — sorted book, client-side grouping, mid/spread, cumulative depth, imbalance. Hard parts: snapshot+delta reconciliation with sequence-gap detection and auto-resync; render coalescing to one commit per animation frame; per-level change tagging for FlashCell; string-decimal math throughout; `status: connecting | live | stale | resyncing`.
- `useTradesFeed(venue, symbol, opts)` — ring buffer of prints; survives thousands of msgs/sec without GC pauses; side/price aggregation.
- `useCandles(venue, symbol, interval)` — REST backfill stitched to live partial candle without gaps or double-counts; feeds lightweight-charts.
- `useMarkPrice` / `useIndexPrice` — with staleness flags.
- `useFunding(symbol)` — current + predicted rate, countdown; normalizes per-venue interval and sign conventions.
- `useMarketStats(symbol)` — 24h vol/high/low/change, OI (TickerBar feed).
- `useLiquidationsFeed(venue)` — public liquidation prints.

### Account hooks
- `usePositions(venue)` — live positions with derived uPnL, ROE, liq price; consistent derivation when position and mark-price ticks arrive on different streams.
- `useOpenOrders` / `useFills` / `useOrderHistory` — the blotter trio; reconciles optimistic local state with out-of-order venue acks/fills.
- `useBalances(venue)` — per-asset, withdrawable vs locked margin.
- `useAccountHealth(venue)` — margin usage, maintenance margin, health ratio, distance-to-liquidation, threshold events (warn before liq, don't report after).
- `usePnlHistory(venue)` — realized PnL series for account panel.

### Cross-cutting hooks
- `useConnection(venue)` — socket health, latency, reconnect state per venue (the status dot).
- `useSubscriptionManager` — internal dedupe: N components watching one market share one stream.
- `useKeyboardTrading(bindings)` — hotkey order actions with arm/confirm safety layer.
- `useOrderSounds(events)` — fill/reject audio cues.

### Build order
1. `useMarkets` (metadata foundation)
2. `useOrderBook` + `useTradesFeed` + `useCandles` → **read-only live terminal demo, no auth needed — the sales asset**
3. Account trio (`usePositions`, `useOpenOrders`/`useFills`, `useAccountHealth`)
4. `useOrderEntry` last — depends on metadata + margin state being correct

### Order lifecycle state machines
- `useLeverageControl` / `useMarginMode` — leverage/margin changes on open positions with venue-specific rules and margin-consequence preview.
- `useTwap(venue, params)` — slice scheduling and progress; native where supported, client-side otherwise.
- `useOrderEntry(venue, market)` — the heart of a perps terminal. A statechart, not a form:
  - fields: side, orderType (market/limit/stop/stopLimit/twap), price, size (base/quote/% of equity), leverage, marginMode (cross/isolated), reduceOnly, TIF (`GTC | IOC | FOK | ALO | GTT` per MODELS.md — ALO is post-only, GTT is pod-style deadline; the selector renders only the venue's `capabilities().tifs`), TP/SL legs
  - derived: notional, required margin, est. entry, est. liq price, fees, slippage estimate, max size
  - validation: tick size, lot size, min notional, max leverage, insufficient margin, price bands
  - states: `idle → validating → confirmable → submitting → acked | rejected`
- `useClosePosition(position)` — full/partial close, market/limit, derived realized PnL preview.
- `useTpSl(position)` — TP/SL editing with RR ratio, trigger price ↔ PnL bidirectional editing.

### Math (pure functions, tree-shakeable)
`liqPrice()`, `unrealizedPnl()`, `roe()`, `fundingPayment()`, `marginRequired()`, `priceImpact()`, `slippageBounds()`, `tickRound()`, `lotRound()`, `aggregateBook()`, `vwap()`, plus swap-side math for later verticals (`ammQuote()`, `minReceived()`).

### Formatting
`formatPrice(v, market)` — tick-aware precision. `formatSize`, `formatCompact` (1.2M), `formatDelta` (+/−, sign semantics), `formatFunding` (bp/percent), `formatCountdown`. All locale-aware, all return structured parts so primitives can style sign/integer/decimal separately.

---

## Layer 1 — Base primitives (`@perpetua/react/components` → primitives)

Generic, unstyled, accessible. Everything below is keyboard-navigable and exposes state via `data-*` attributes for styling.

**Numeric display**
- `<Num>` — tabular-numeral text with structured parts (sign, int, frac, unit)
- `<Delta>` — value with up/down/flat semantic state
- `<FlashCell>` — flashes on change (up/down), the atom of every live table
- `<Sparkline>` — inline SVG mini-chart
- `<CountdownText>` — funding/expiry countdowns

**Input**
- `<NumericInput>` — decimal-string based (never float), min/max/step, tick/lot rounding, paste sanitizing
- `<SteppedSlider>` — leverage-style slider with detents and editable value
- `<PercentButtonGroup>` — 25/50/75/Max
- `<SegmentedControl>` — order type, margin mode, chart intervals
- `<SideToggle>` — two-state buy/sell control with semantic coloring hooks
- `<SearchInput>`, `<Checkbox>`, `<Switch>`, `<TokenAmountInput>` (asset + amount composite)

**Overlay & structure**
- `<Popover>`, `<Tooltip>`, `<Dialog>`, `<Drawer>`, `<DropdownMenu>`, `<Toast>`, `<Tabs>`, `<Accordion>`, `<ContextMenu>`
- `<DataTable>` — virtualized, sortable, column-resizable; the base of every blotter
- `<VirtualList>` — the base of books and feeds
- `<PanelGrid>` — draggable/resizable workspace layout (golden-layout style)
- `<StatusDot>`, `<Badge>`, `<Skeleton>`, `<EmptyState>`, `<KeyValueRow>`, `<Meter>` (health/margin bars)

---

## Layer 2 — Trading atoms

Domain-aware compositions of Layer 1 + core hooks. Still small, single-purpose.

- `<PriceText>` — tick-formatted price with FlashCell behavior
- `<PnlText>` — signed PnL with profit/loss token colors, abs/percent modes
- `<PairLabel>` / `<AssetIcon>` / `<MarketBadge>` (perp badge, leverage cap)
- `<TickerStat>` — labeled stat (mark, 24h vol, OI, funding) for ticker bars
- `<FundingBadge>` — rate + countdown, predicted vs current
- `<DepthBar>` — the horizontal bid/ask depth fill behind book rows
- `<SpreadRow>` — mid price + spread readout between book sides
- `<LeverageSlider>` — SteppedSlider bound to market max leverage
- `<SizeInput>` — NumericInput with base/quote/% unit switching
- `<SlippageControl>` — presets + custom with warning states
- `<TifSelector>`, `<OrderTypeSelector>`, `<MarginModeToggle>`, `<ReduceOnlyCheckbox>`
- `<FeeBreakdown>` — maker/taker/est. total rows
- `<LiqPriceLabel>` — with proximity warning state
- `<HealthMeter>` — account health with threshold coloring
- `<RiskRow>` — label/value/tooltip row used across confirm dialogs

---

## Layer 3 — Molecules (the widgets people screenshot)

- `<OrderBook>` — asks/spread/bids, grouping selector, depth visualization, click-to-fill-price, buy/sell ratio bar. Virtualized, 60fps under full-feed load.
- `<TradesFeed>` — live prints with flash, size-weighted rows
- `<OrderEntryPanel>` — the full ticket: side toggle, type tabs, price/size, leverage, margin mode, TP/SL, reduce-only/post-only, fee + liq preview, submit with confirm
- `<PositionsTable>` — entry/mark/liq/uPnL/ROE/margin, inline TP/SL edit, close buttons
- `<OpenOrdersTable>` / `<FillsTable>` / `<OrderHistoryTable>`
- `<AccountPanel>` — equity, margin usage, HealthMeter, withdrawable
- `<MarketSelector>` — searchable market switcher with favorites, vol/change columns
- `<TickerBar>` — pair + mark/index/24h/OI/funding strip
- `<ClosePositionDialog>`, `<TpSlDialog>`, `<OrderConfirmDialog>`, `<LeverageDialog>`
- `<DepthChart>` — cumulative depth area chart
- Chart container: venue around TradingView `lightweight-charts` (Apache-2.0) — `<CandleChart>` with mark/liq/entry price lines and order markers

**Later verticals reuse ~70% of the above:**
- Swap: `<SwapCard>` = TokenAmountInput ×2 + SlippageControl + RiskRow + route preview
- Prediction markets: `<OutcomeCard>`, `<ProbabilityBar>`, `<ResolutionBanner>` on top of the same book/table/entry primitives

## Layer 4 — Templates

- `<PerpsTerminal>` — full workspace: TickerBar / Chart / OrderBook / TradesFeed / OrderEntryPanel / blotter tabs, on PanelGrid with saved layouts
- `<MobileTerminal>` — stacked variant with bottom-sheet order entry

---

## Theming contract

Every component styles itself **only** through tokens (see `tokens/`). No literal colors, sizes, or fonts in components. State is exposed as `data-side="long|short"`, `data-delta="up|down|flat"`, `data-health="safe|warn|danger"` etc., so any styling system can target it.

Density is a first-class token axis (`compact | comfortable`) because pro traders demand compact and retail products demand comfortable.

## Non-goals (v1)
Custom charting engine, exchange integrations beyond reference venues, wallet onboarding UI, mobile-native components.
