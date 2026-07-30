# @perpkit/core

Headless perp trading client: venue contract, subscription actions, order-book engine, exact decimal math, and structured formatters. No DOM, no CSS, no React; pure and tree-shakeable.

Every price and size crosses the API as a decimal string. Arithmetic runs on an exact decimal engine internally, so no float ever touches a price.

## Install

```bash
pnpm add @perpkit/core
```

Pair it with a venue adapter such as `@perpkit/venues`.

## Example

```ts
import { createClient, watchOrderBook } from "@perpkit/core";
import { hyperliquid } from "@perpkit/venues/hyperliquid";

const client = createClient({ venue: hyperliquid() });

const markets = await client.market.markets();
const btc = markets.find((m) => m.symbol === "BTC-PERP")!;

watchOrderBook(client, {
  marketId: btc.id,
  depth: 12,
  onUpdate: (book) => console.log(book.status, book.mid, book.bids[0]),
});
```

Entry points: `@perpkit/core` (everything), plus focused subpaths `/contract`, `/math`, `/format`, `/actions`, `/client`, and `/testing` (venue conformance suite + deterministic mock venue).

## Docs

- [Getting started](https://github.com/tomiiide/perpetua/blob/main/docs/getting-started.md)
- [Writing a venue](https://github.com/tomiiide/perpetua/blob/main/docs/writing-a-venue.md)
- [Core spec](https://github.com/tomiiide/perpetua/blob/main/CORE_SPEC.md) and [canonical models](https://github.com/tomiiide/perpetua/blob/main/MODELS.md)

MIT.
