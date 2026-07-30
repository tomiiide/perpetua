import type { EventSink, MarketDataVenue, Subscription, Unsubscribe, Venue } from "@perpetua/core";
import { fetchBookSnapshot, subscribeBook } from "./book.js";
import { binanceCapabilities } from "./capabilities.js";
import { fetchCandles, subscribeCandle } from "./candles.js";
import { subscribeFunding } from "./funding.js";
import { subscribeLiquidations } from "./liquidations.js";
import { fetchMarkets } from "./markets.js";
import { subscribeIndexPrice, subscribeMarkPrice } from "./prices.js";
import { createRestClient } from "./rest-client.js";
import { subscribeStats } from "./stats.js";
import { subscribeTrades } from "./trades.js";
import { BinanceWsClient } from "./ws-client.js";

export interface BinanceConfig {
  restUrl?: string;
  wsPublicUrl?: string;
  wsMarketUrl?: string;
}

const DEFAULT_REST_URL = "https://fapi.binance.com";
/** Binance routes futures streams: depth/bookTicker only on /public, all other market data only on /market. */
const DEFAULT_WS_PUBLIC_URL = "wss://fstream.binance.com/public/stream";
const DEFAULT_WS_MARKET_URL = "wss://fstream.binance.com/market/stream";

export function binance(config: BinanceConfig = {}): Venue {
  const rest = createRestClient(config.restUrl ?? DEFAULT_REST_URL);
  const publicWs = new BinanceWsClient(config.wsPublicUrl ?? DEFAULT_WS_PUBLIC_URL);
  const marketWs = new BinanceWsClient(config.wsMarketUrl ?? DEFAULT_WS_MARKET_URL);

  const market: MarketDataVenue = {
    id: "binance",

    capabilities: binanceCapabilities,

    markets: () => fetchMarkets(rest),

    subscribe(sub: Subscription, sink: EventSink): Unsubscribe {
      switch (sub.kind) {
        case "book":
          return subscribeBook(publicWs, rest, sub.marketId, sink);
        case "trades":
          return subscribeTrades(marketWs, sub.marketId, sink);
        case "candle":
          return subscribeCandle(marketWs, sub.marketId, sub.resolution, sink);
        case "markPrice":
          return subscribeMarkPrice(marketWs, sub.marketId, sink);
        case "indexPrice":
          return subscribeIndexPrice(marketWs, sub.marketId, sink);
        case "funding":
          return subscribeFunding(marketWs, rest, sub.marketId, sink);
        case "stats":
          return subscribeStats(marketWs, rest, sub.marketId, sink);
        case "liquidations":
          return subscribeLiquidations(marketWs, sink);
      }
    },

    fetchBookSnapshot: (marketId) => fetchBookSnapshot(rest, marketId),

    fetchCandles: (marketId, resolution, range) => fetchCandles(rest, marketId, resolution, range),
  };

  return { id: "binance", market };
}
