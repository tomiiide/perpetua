import type { EventSink, MarketId, Unsubscribe } from "@perpetua/core";
import { coinFromMarketId, mapPrices } from "./mapping.js";
import type { HlActiveAssetCtx } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

/**
 * `markPrice` and `indexPrice` subscriptions both ride HL's single
 * `activeAssetCtx` channel (deduped by the ws client's subscription key) —
 * HL has no separate index-price feed (see mapPrices: `index` is left null,
 * `oracle` carries `oraclePx`).
 */
function subscribeActiveAssetCtxPrices(
  ws: HlWsClient,
  marketId: MarketId,
  kind: "markPrice" | "indexPrice",
  sink: EventSink,
): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  return ws.subscribe({ type: "activeAssetCtx", coin }, (data) => {
    const { ctx } = data as HlActiveAssetCtx;
    sink({ kind, prices: mapPrices(ctx, Date.now()) });
  });
}

export function subscribeMarkPrice(ws: HlWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  return subscribeActiveAssetCtxPrices(ws, marketId, "markPrice", sink);
}

export function subscribeIndexPrice(ws: HlWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  return subscribeActiveAssetCtxPrices(ws, marketId, "indexPrice", sink);
}
