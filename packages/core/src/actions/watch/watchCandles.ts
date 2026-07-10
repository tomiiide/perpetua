import type { Client } from "../../client/index.js";
import type { Candle, MarketId, Resolution } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchCandlesOptions {
  marketId: MarketId;
  resolution: Resolution;
  onUpdate: (candles: Candle[]) => void;
}

export function watchCandles(client: Client, opts: WatchCandlesOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchCandles", "M2 — CandleStitcher");
}
