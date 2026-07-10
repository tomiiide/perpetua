import type { Client } from "../../client/index.js";
import type { BookState, Dec, MarketId } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchOrderBookOptions {
  marketId: MarketId;
  grouping?: Dec;
  depth?: number;
  frameBudget?: number;
  onUpdate: (book: BookState) => void;
}

export function watchOrderBook(client: Client, opts: WatchOrderBookOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchOrderBook", "M1 — BookEngine");
}
