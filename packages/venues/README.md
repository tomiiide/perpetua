# @perpetua/venues

Venue adapters for [`@perpetua/core`](https://www.npmjs.com/package/@perpetua/core). Each adapter translates one exchange's wire formats into the canonical contract; everything above the adapter is venue-agnostic.

Ships today: **Hyperliquid** live market data (order book, trades, candles, mark/index prices, funding, stats) over REST + WebSocket, no credentials required. A Binance USD-M adapter is in progress.

## Install

```bash
pnpm add @perpetua/core @perpetua/venues
```

## Example

```ts
import { createClient } from "@perpetua/core";
import { hyperliquid } from "@perpetua/venues/hyperliquid";

const client = createClient({ venue: hyperliquid() });
const markets = await client.market.markets();

const off = client.market.subscribe(
  { kind: "trades", marketId: markets[0]!.id },
  (e) => {
    if (e.kind === "trades") console.log(e.trades);
  },
);
```

Every adapter must pass the conformance suite in `@perpetua/core/testing` before release. To build your own, see [Writing a venue](https://github.com/tomiiide/perpetua/blob/main/docs/writing-a-venue.md).

## Docs

- [Getting started](https://github.com/tomiiide/perpetua/blob/main/docs/getting-started.md)
- [Writing a venue](https://github.com/tomiiide/perpetua/blob/main/docs/writing-a-venue.md)

MIT.
