# Getting started

Perpetua is three packages:

| Package | What it gives you |
| --- | --- |
| `@perpetua/core` | Headless client, `watchOrderBook` (BookEngine), decimal math, formatters, the venue contract. No DOM, no React. |
| `@perpetua/venues` | Venue adapters. Hyperliquid market data ships today. |
| `@perpetua/react` | Unstyled, accessible React primitives plus the `--pt-*` theme layer. |

You can stop at any layer: core alone for a bot or backend, core + venues for data pipelines, all three for a terminal UI.

## Install

```bash
pnpm add @perpetua/core @perpetua/venues        # headless
pnpm add @perpetua/react                        # optional, React 18/19 peer
```

Runtime requirements: global `fetch` and `WebSocket` (any modern browser, Node 22+, Bun, or Deno). No other runtime dependencies in core or venues.

## A minimal Node order-book watcher

One venue per client, viem-style. Market discovery happens once through `client.market.markets()`; everything else is keyed by the opaque `MarketId` from that list, never by display symbol.

```ts
// watch-book.ts, run with: node --experimental-strip-types watch-book.ts (or tsx)
import { createClient, watchOrderBook } from "@perpetua/core";
import { hyperliquid } from "@perpetua/venues/hyperliquid";

const client = createClient({ venue: hyperliquid() });

const markets = await client.market.markets();
const btc = markets.find((m) => m.symbol === "BTC-PERP");
if (!btc) throw new Error("no BTC-PERP market");

const unwatch = watchOrderBook(client, {
  marketId: btc.id,
  depth: 12,                 // levels per side
  grouping: btc.tickSize,    // price aggregation step (any multiple of tickSize)
  onUpdate: (book) => {
    console.log(book.status, "mid:", book.mid, "spread:", book.spread);
    console.log("best bid:", book.bids[0], "best ask:", book.asks[0]);
  },
});

// later: unwatch();
```

`watchOrderBook` drives the `BookEngine` internally: snapshot buffering, sequence-gap resync, derived grouping, imbalance, and per-level flash tagging. `onUpdate` receives a coalesced `BookState` per frame:

```ts
interface BookState {
  marketId: MarketId;
  bids: BookLevel[];          // strictly descending prices
  asks: BookLevel[];          // strictly ascending prices
  mid: string | null;
  spread: string | null;
  spreadPct: number | null;   // ratios are the only lossy numbers
  imbalance: number | null;
  grouping: string;
  status: "connecting" | "live" | "stale" | "resyncing" | "error";
  ts: number;                 // ms
  changes: LevelFlash[];      // what changed this frame, for flash styling
  clearingPrice: string | null;  // batch-auction venues only
  nextAuctionIn: number | null;
}
```

Every price and size is a decimal `string`, exact and JSON-safe. No float ever touches a price; when you need arithmetic, use the `/math` helpers (string-in/string-out) or the exported `Dec` layer. See [CORE_SPEC.md §3](../CORE_SPEC.md) for the numeric policy.

## Raw venue feeds

For everything that is not the order book, subscribe to normalized venue events directly:

```ts
const offTrades = client.market.subscribe(
  { kind: "trades", marketId: btc.id },
  (event) => {
    if (event.kind === "trades") {
      for (const t of event.trades) console.log(t.side, t.price, t.size);
    }
  },
);

const offMark = client.market.subscribe(
  { kind: "markPrice", marketId: btc.id },
  (event) => {
    if (event.kind === "markPrice") console.log("mark:", event.prices.mark);
  },
);
```

Subscription kinds: `book`, `trades`, `candle` (takes a `resolution`), `markPrice`, `indexPrice`, `funding`, `stats`, `liquidations`. Availability is capability-gated per venue; check `client.market.capabilities()` before relying on a feed. Candle history comes from `client.market.fetchCandles(marketId, resolution, { from, to })`.

## Math and formatting

Pure, tree-shakeable helpers. All rounding is explicit:

```ts
import { tickRound, formatPrice } from "@perpetua/core";

const price = tickRound("64051.5342", { tickSize: "0.1" }, "down"); // "64051.5"

const parts = formatPrice(price, { tickSize: "0.1" });
// { sign: "", int: "64,051", frac: "5", unit: "", text: "64,051.5" }
```

Formatters return structured parts (`sign`, `int`, `frac`, `unit`, `text`) so UIs can style each piece independently.

## The React path

`@perpetua/react` ships unstyled primitives. They carry structure, accessibility, and state (as `data-*` attributes); all visuals come from the `--pt-*` CSS token contract. Import the tokens once, then style with plain CSS, Tailwind, or MUI (see [theming.md](theming.md)).

A live order-book hook is a thin wrapper over `watchOrderBook`:

```tsx
import { useEffect, useState } from "react";
import type { BookState, MarketId } from "@perpetua/core";
import { watchOrderBook } from "@perpetua/core";
import { client } from "./lib/perpetua"; // your shared createClient instance

export function useOrderBook(marketId: MarketId | null): BookState | null {
  const [book, setBook] = useState<BookState | null>(null);
  useEffect(() => {
    if (!marketId) return;
    setBook(null);
    return watchOrderBook(client, { marketId, onUpdate: setBook });
  }, [marketId]);
  return book;
}
```

Rendering with the primitives:

```tsx
import "@perpetua/react/theme/tokens.css";
import { Num, StatusDot } from "@perpetua/react/components";
import { formatPrice, formatSize } from "@perpetua/core";
import type { BookState, Market } from "@perpetua/core";

export function BookRow({ book, market }: { book: BookState; market: Market }) {
  const bid = book.bids[0];
  if (!bid) return null;
  return (
    <div data-side="buy">
      <StatusDot status={book.status} label={book.status} />
      <Num parts={formatPrice(bid.price, market)} />
      <Num parts={formatSize(bid.size, market)} />
    </div>
  );
}
```

`data-side="buy"` is the styling hook: with the shipped tokens, `[data-side="buy"] { color: var(--pt-long); }` colors the row. Every primitive follows this pattern (`data-side`, `data-delta`, `data-health`, `data-flash`, `data-status`).

For a complete wired application (ticker, chart, book, trades tape, order entry) see the live terminal in [`examples/terminal`](../examples/terminal), which is exactly this pattern scaled up.

## Status and scope

What ships today is live market data, end to end: order book, trades, candles, mark/index prices, funding, and stats over the Hyperliquid adapter. The account and write surfaces (`positions`, `placeOrder`, and friends) are defined in the contract ([CORE_SPEC.md §4](../CORE_SPEC.md)) and land per venue; calling an unimplemented action throws a clear `not implemented` error rather than failing silently. A Binance USD-M adapter is in progress.
