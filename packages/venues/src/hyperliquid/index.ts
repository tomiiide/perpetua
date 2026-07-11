import type { EventSink, MarketDataVenue, Subscription, Unsubscribe, Venue } from "@perpetua/core";
import { fetchBookSnapshot, subscribeBook } from "./book.js";
import { hyperliquidCapabilities } from "./capabilities.js";
import { fetchCandles, subscribeCandle } from "./candles.js";
import { subscribeFunding } from "./funding.js";
import { createInfoClient } from "./info-client.js";
import { fetchMarkets } from "./markets.js";
import { subscribeIndexPrice, subscribeMarkPrice } from "./prices.js";
import { subscribeStats } from "./stats.js";
import { subscribeTrades } from "./trades.js";
import { HlWsClient } from "./ws-client.js";

export interface HyperliquidConfig {
  infoUrl?: string;
  wsUrl?: string;
}

const DEFAULT_INFO_URL = "https://api.hyperliquid.xyz/info";
const DEFAULT_WS_URL = "wss://api.hyperliquid.xyz/ws";

/** HL has no public liquidations feed; documented no-op per CORE_SPEC.md's gap policy — sink is never called. */
function subscribeLiquidations(): Unsubscribe {
  return () => {};
}

export function hyperliquid(config: HyperliquidConfig = {}): Venue {
  const infoUrl = config.infoUrl ?? DEFAULT_INFO_URL;
  const wsUrl = config.wsUrl ?? DEFAULT_WS_URL;
  const info = createInfoClient(infoUrl);
  const ws = new HlWsClient(wsUrl);

  const market: MarketDataVenue = {
    id: "hyperliquid",

    capabilities: hyperliquidCapabilities,

    markets: () => fetchMarkets(info),

    subscribe(sub: Subscription, sink: EventSink): Unsubscribe {
      switch (sub.kind) {
        case "book":
          return subscribeBook(ws, sub.marketId, sink);
        case "trades":
          return subscribeTrades(ws, sub.marketId, sink);
        case "candle":
          return subscribeCandle(ws, sub.marketId, sub.resolution, sink);
        case "markPrice":
          return subscribeMarkPrice(ws, sub.marketId, sink);
        case "indexPrice":
          return subscribeIndexPrice(ws, sub.marketId, sink);
        case "funding":
          return subscribeFunding(ws, info, sub.marketId, sink);
        case "stats":
          return subscribeStats(ws, info, sub.marketId, sink);
        case "liquidations":
          return subscribeLiquidations();
      }
    },

    fetchBookSnapshot: (marketId) => fetchBookSnapshot(info, marketId),

    fetchCandles: (marketId, resolution, range) => fetchCandles(info, marketId, resolution, range),
  };

  return { id: "hyperliquid", market };
}
