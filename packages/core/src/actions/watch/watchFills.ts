import type { Client } from "../../client/index.js";
import type { Fill } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchFillsOptions {
  onUpdate: (fills: Fill[]) => void;
}

export function watchFills(client: Client, opts: WatchFillsOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchFills", "M4 — BlotterEngine");
}
