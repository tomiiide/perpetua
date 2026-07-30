import type { EventSink, MarketId, Unsubscribe } from "@perpkit/core";
import { mapAggTrade, streamName, symbolFromMarketId } from "./mapping.js";
import type { BnAggTrade } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

export function subscribeTrades(ws: BinanceWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  return ws.subscribe(streamName(symbol, "aggTrade"), (data) => {
    sink({ kind: "trades", trades: [mapAggTrade(data as BnAggTrade)] });
  });
}
