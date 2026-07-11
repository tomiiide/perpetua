import type { EventSink, MarketId, Unsubscribe } from "@perpetua/core";
import { coinFromMarketId, mapTrade } from "./mapping.js";
import type { HlWsTrade } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

export function subscribeTrades(ws: HlWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  return ws.subscribe({ type: "trades", coin }, (data) => {
    const trades = (data as HlWsTrade[]).map(mapTrade);
    if (trades.length > 0) sink({ kind: "trades", trades });
  });
}
