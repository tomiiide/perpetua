import type { EventSink, Unsubscribe } from "@perpetua/core";
import { mapForceOrder } from "./mapping.js";
import type { BnForceOrder } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

/** All-market liquidation orders; Binance throttles pushes to at most one per symbol per second. */
export function subscribeLiquidations(ws: BinanceWsClient, sink: EventSink): Unsubscribe {
  return ws.subscribe("!forceOrder@arr", (data) => {
    sink({ kind: "liquidations", trades: [mapForceOrder(data as BnForceOrder)] });
  });
}
