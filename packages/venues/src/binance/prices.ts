import type { EventSink, MarketId, Unsubscribe } from "@perpetua/core";
import { mapPrices, streamName, symbolFromMarketId } from "./mapping.js";
import type { BnMarkPriceUpdate } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

/**
 * `markPrice` and `indexPrice` subscriptions both ride Binance's single
 * `markPrice@1s` stream (deduped by the ws client's channel key) — the
 * update carries both prices; `oracle` is left null (see mapPrices).
 */
function subscribeMarkStreamPrices(
  ws: BinanceWsClient,
  marketId: MarketId,
  kind: "markPrice" | "indexPrice",
  sink: EventSink,
): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  return ws.subscribe(streamName(symbol, "markPrice@1s"), (data) => {
    sink({ kind, prices: mapPrices(data as BnMarkPriceUpdate) });
  });
}

export function subscribeMarkPrice(ws: BinanceWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  return subscribeMarkStreamPrices(ws, marketId, "markPrice", sink);
}

export function subscribeIndexPrice(ws: BinanceWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  return subscribeMarkStreamPrices(ws, marketId, "indexPrice", sink);
}
