import type { Client } from "../../client/index.js";
import type { MarketId, Trade } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchTradesOptions {
  marketId: MarketId;
  /** ring buffer size; default 200. */
  maxRows?: number;
  onUpdate: (trades: Trade[]) => void;
}

export function watchTrades(client: Client, opts: WatchTradesOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchTrades", "M2");
}
