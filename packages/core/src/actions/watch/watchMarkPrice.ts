import type { Client } from "../../client/index.js";
import type { MarketId, Prices } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchPriceOptions {
  marketId: MarketId;
  onUpdate: (prices: Prices) => void;
}

export function watchMarkPrice(client: Client, opts: WatchPriceOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchMarkPrice", "M2");
}

export function watchIndexPrice(client: Client, opts: WatchPriceOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchIndexPrice", "M2");
}
