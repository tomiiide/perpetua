import type { Candle, EventSink, MarketId, Range, Resolution, Unsubscribe } from "@perpetua/core";
import type { InfoClient } from "./info-client.js";
import { coinFromMarketId, mapCandle } from "./mapping.js";
import type { HlCandle } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

export async function fetchCandles(
  info: InfoClient,
  marketId: MarketId,
  resolution: Resolution,
  range: Range,
): Promise<Candle[]> {
  const coin = coinFromMarketId(marketId);
  const candles = await info.post<HlCandle[]>({
    type: "candleSnapshot",
    req: { coin, interval: resolution, startTime: range.from, endTime: range.to },
  });
  return candles.map(mapCandle);
}

export function subscribeCandle(
  ws: HlWsClient,
  marketId: MarketId,
  resolution: Resolution,
  sink: EventSink,
): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  return ws.subscribe({ type: "candle", coin, interval: resolution }, (data) => {
    sink({ kind: "candle", candle: mapCandle(data as HlCandle) });
  });
}
