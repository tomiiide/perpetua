# Writing a venue

A venue adapter is the only venue-specific code in a Perpetua stack. It translates one exchange's wire formats into the canonical contract; everything above it (engines, actions, React) is venue-agnostic. This guide covers the market-data surface, which is what ships today.

The authoritative definitions live in two places. Do not work from memory of them:

- [CORE_SPEC.md §4](../CORE_SPEC.md): the venue contract, its division of labor, and venue profiles.
- [MODELS.md](../MODELS.md): every canonical type (`Market`, `BookEvent`, `Trade`, `Candle`, `Capabilities`, ...) with per-field rules.

The TypeScript source of truth is `@perpkit/core/contract`.

## The shape of a venue

A venue package exports one factory returning a `Venue`:

```ts
import type { EventSink, MarketDataVenue, Subscription, Unsubscribe, Venue } from "@perpkit/core";

export interface AcmeConfig {
  apiUrl?: string;
  wsUrl?: string;
}

export function acme(config: AcmeConfig = {}): Venue {
  const market: MarketDataVenue = {
    id: "acme",
    capabilities: () => ACME_CAPABILITIES,
    markets: async () => {/* fetch + map to canonical Market[] */},
    subscribe: (sub: Subscription, sink: EventSink): Unsubscribe => {/* ... */},
    fetchBookSnapshot: async (marketId) => {/* REST snapshot as BookEvent */},
    fetchCandles: async (marketId, resolution, range) => {/* Candle[] */},
  };
  return { id: "acme", market };
}
```

Configuration is plain factory props (URLs, transports). The optional `account` surface activates later via a credential source (`MaybeSource`, CORE_SPEC.md §5.4); market data never needs credentials.

## Subscription and EventSink

`subscribe(sub, sink)` is the whole streaming surface. `sub` is a discriminated union (`book`, `trades`, `candle`, `markPrice`, `indexPrice`, `funding`, `stats`, `liquidations`); the venue pushes normalized `VenueEvent` values into `sink` and returns an `Unsubscribe`. The rules:

- **Only emit the requested kind.** A `book` subscription must never see a `trades` event.
- **Unsubscribe silences immediately.** After the returned function runs, the sink must never be called again, even for events already in flight.
- **Subscriptions are isolated.** Two subscribers to the same feed each get their own events; cancelling one must not affect the other. Share the underlying socket, not the sink list entry.
- **Reject unsupported requests loudly.** An unsupported candle resolution (anything outside `capabilities().candleResolutions`) throws `ValidationError` from `@perpkit/core`, synchronously for `subscribe`, as a rejection for `fetchCandles`.
- **Ordering is the engine's job, sequence passthrough is yours.** Do not reorder or de-gap the book feed; if the venue provides sequence numbers, pass them through on `BookEvent.seq` and set `capabilities().sequenceNumbers: true`. The `BookEngine` handles gap detection and resync (it calls your `fetchBookSnapshot` to recover).
- **A capability you lack is a documented no-op or a gate, never a lie.** Hyperliquid has no public liquidations feed, so its `liquidations` subscription returns an unsubscriber and never calls the sink. If `publicTape` is `false`, a `trades` subscription must emit nothing.

## Data rules (the ones the suite checks hardest)

- **Every price and size is a decimal string.** `"64051.5"`, never `64051.5`, never scientific notation, never hex. Signed values (funding, PnL) keep their sign in the string. Convert venue-native encodings (floats, 1e18 hex, scaled ints) at your boundary and nowhere else.
- **Sizes are always positive; direction is always an explicit `side` enum.** No signed-size conventions. A delta size of `"0"` means remove the level.
- **Alignment:** every book price is a multiple of the market's `tickSize`, every size a multiple of `lotSize`.
- **Timestamps are integer milliseconds.** Venues with µs or s wire formats convert at the boundary.
- **`MarketId` is venue-qualified and opaque:** `"acme:BTC"`, prefixed with your venue id. It is never parsed or displayed; display strings come from `Market.symbol`/`base`/`quote`.
- **`markets()` is deterministic** for a given exchange state, with unique ids.
- **Books never cross:** bids strictly descending, asks strictly ascending, `max(bid) < min(ask)`.
- **Candles:** strictly ascending `ts`, OHLC internally consistent (`low <= open,close <= high`), only the final candle may be open (`closed: false`).
- **Irreducibly venue-specific data goes in `ext`**, typed per venue via declaration merging. Never widen a canonical field for one venue.

`Capabilities` is how the rest of the stack adapts to your venue: `matching`, `bookFeed` (`diff` | `pushSnapshot` | `pollSnapshot`), `sequenceNumbers`, `publicTape`, `candleResolutions`, and so on. Fill it honestly; the full interface with per-field commentary is in [MODELS.md](../MODELS.md), and CORE_SPEC.md §4.1 shows how three very different venues (Hyperliquid, pod, Binance) map onto it.

## Running the conformance suite

`@perpkit/core/testing` ships `runConformance`, which drives a `MarketDataVenue` purely through its public contract and reports every invariant violation: capability domains, market shapes, decimal-string discipline, alignment, ordering, gating, `ValidationError` rejection, unsubscribe silence, and subscription isolation. Passing it is the bar for shipping a venue package.

```ts
// acme.conformance.test.ts
import { describe, expect, it } from "vitest";
import { runConformance } from "@perpkit/core/testing";
import { acme } from "./index.js";

describe("acme venue conformance", () => {
  it("passes every contract invariant", async () => {
    const report = await runConformance(acme({ /* point at fixtures, see below */ }).market);
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
  });
});
```

`ConformanceReport` is `{ venue, checks, failures, passed }`; each failure names the violated check (`book.level.price.aligned`, `reject.candleResolution`, ...) with detail, so a red run reads as a to-do list.

Run it against recorded fixtures, not the live exchange: capture real sessions, replay them through your transport (the factory's URL/transport props exist exactly so tests can inject a replay), and keep the suite deterministic. `@perpkit/core/testing` also exports the pieces the core test-bed uses: `createMockVenue` (the reference implementation proving the contract is implementable; read its source when a rule is ambiguous), `createTestClock`, and `createTestScheduler`. The full testing strategy, including the adversarial book suite, is CORE_SPEC.md §9.

## Checklist

1. Map `capabilities()` honestly against [MODELS.md](../MODELS.md).
2. Implement `markets()` with qualified ids and decimal-string `tickSize`/`lotSize`.
3. Implement `fetchBookSnapshot`, `fetchCandles`, and `subscribe` for each supported kind; gate or no-op the rest.
4. Do all encoding conversion (floats, hex, µs) at your boundary.
5. Record fixtures; get `runConformance` green on replay.
6. Point `watchOrderBook` at your venue and watch a live book render in `examples/terminal` by swapping the venue in `src/lib/perpetua.ts`.

The Hyperliquid adapter (`packages/venues/src/hyperliquid`) is the worked example: an `info` REST client plus one multiplexed WebSocket client, per-feed subscribe modules, and a `mapping.ts` where every wire-to-canonical conversion lives.
