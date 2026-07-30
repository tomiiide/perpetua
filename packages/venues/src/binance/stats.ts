import {
  dec,
  decToString,
  type Dec,
  type EventSink,
  type MarketId,
  type MarketStats,
  type Unsubscribe,
} from "@perpetua/core";
import { streamName, symbolFromMarketId } from "./mapping.js";
import type { RestClient } from "./rest-client.js";
import type { BnOpenInterest, BnTicker24h } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

const OPEN_INTEREST_POLL_MS = 60_000;

/** Binance's `@ticker` stream has no open-interest field, so it's backfilled from a lightly-polled REST call. */
export function subscribeStats(
  ws: BinanceWsClient,
  rest: RestClient,
  marketId: MarketId,
  sink: EventSink,
): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  let openInterest: Dec | null = null;

  const refreshOpenInterest = (): void => {
    rest
      .get<BnOpenInterest>("/fapi/v1/openInterest", { symbol })
      .then((result) => {
        openInterest = dec(result.openInterest);
      })
      .catch(() => {
        // transient failure: keep the last known open interest
      });
  };
  refreshOpenInterest();
  const pollTimer = setInterval(refreshOpenInterest, OPEN_INTEREST_POLL_MS);

  const unsubscribeWs = ws.subscribe(streamName(symbol, "ticker"), (data) => {
    const t = data as BnTicker24h;
    const stats: MarketStats = {
      vol24h: decToString(dec(t.q)),
      high24h: decToString(dec(t.h)),
      low24h: decToString(dec(t.l)),
      change24hPct: Number(t.P),
      openInterest: openInterest === null ? null : decToString(openInterest),
      lastPrice: decToString(dec(t.c)),
      ts: t.E,
    };
    sink({ kind: "stats", stats });
  });

  return () => {
    clearInterval(pollTimer);
    unsubscribeWs();
  };
}
