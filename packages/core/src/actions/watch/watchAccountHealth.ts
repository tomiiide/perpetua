import type { Client } from "../../client/index.js";
import type { AccountSnapshot } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchAccountHealthOptions {
  onUpdate: (snapshot: AccountSnapshot) => void;
}

export function watchAccountHealth(client: Client, opts: WatchAccountHealthOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchAccountHealth", "M4");
}
