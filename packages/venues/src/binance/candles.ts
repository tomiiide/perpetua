import type { Candle, EventSink, MarketId, Range, Resolution, Unsubscribe } from "@perpetua/core";
import { mapKlineRow, mapWsKline, streamName, symbolFromMarketId } from "./mapping.js";
import type { RestClient } from "./rest-client.js";
import type { BnKlineRow, BnWsKline } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

/** Canonical `Resolution` strings are valid Binance kline intervals verbatim. */
export async function fetchCandles(
  rest: RestClient,
  marketId: MarketId,
  resolution: Resolution,
  range: Range,
): Promise<Candle[]> {
  const symbol = symbolFromMarketId(marketId);
  const rows = await rest.get<BnKlineRow[]>("/fapi/v1/klines", {
    symbol,
    interval: resolution,
    startTime: String(range.from),
    endTime: String(range.to),
  });
  return rows.map(mapKlineRow);
}

export function subscribeCandle(
  ws: BinanceWsClient,
  marketId: MarketId,
  resolution: Resolution,
  sink: EventSink,
): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  return ws.subscribe(streamName(symbol, `kline_${resolution}`), (data) => {
    sink({ kind: "candle", candle: mapWsKline((data as BnWsKline).k) });
  });
}
