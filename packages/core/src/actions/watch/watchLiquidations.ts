import type { Client } from "../../client/index.js";
import type { Trade } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchLiquidationsOptions {
  onUpdate: (liquidations: Trade[]) => void;
}

export function watchLiquidations(client: Client, opts: WatchLiquidationsOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchLiquidations", "M2");
}
