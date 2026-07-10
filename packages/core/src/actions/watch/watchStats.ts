import type { Client } from "../../client/index.js";
import type { MarketId, MarketStats } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchStatsOptions {
  marketId: MarketId;
  onUpdate: (stats: MarketStats) => void;
}

export function watchStats(client: Client, opts: WatchStatsOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchStats", "M2");
}
