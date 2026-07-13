# @perpetua/example-terminal

A live perps terminal that dogfoods the full Perpetua stack against **Hyperliquid** — no auth, read-only market data.

- `@perpetua/core` — client, `watchOrderBook` (BookEngine), decimal math, formatters
- `@perpetua/venues/hyperliquid` — live REST + WebSocket market data
- `@perpetua/react` — unstyled primitives, styled here purely through the `--pt-*` token contract

## Run

```bash
pnpm --filter @perpetua/example-terminal dev
# http://localhost:5173
```

## What's wired

| Panel | Source |
|---|---|
| Ticker (mark, 24h change/high/low/vol, OI, funding + countdown, sparkline) | `watch` markPrice / stats / funding + candles |
| Chart (candlesticks) | `fetchCandles` history + live `candle` stream |
| Order Book (grouping, depth bars, spread, flash) | `watchOrderBook` → `BookEngine` |
| Trades tape | `subscribe({ kind: "trades" })` |
| Order Entry | primitives + `marginRequired` / `liqPrice` math |
| Account blotter | `EmptyState` — no account venue in this build |

## Read-only by design

This Hyperliquid venue ships market data only (`capabilities().credential === null`). Order entry is a fully-derived UI shell with a disabled submit — there is no account/write surface to place a real order.
