import type { Client } from "../../client/index.js";
import type { Funding, MarketId } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchFundingOptions {
  marketId: MarketId;
  onUpdate: (funding: Funding) => void;
}

export function watchFunding(client: Client, opts: WatchFundingOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchFunding", "M2");
}
