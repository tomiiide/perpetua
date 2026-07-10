import type { Client } from "../../client/index.js";
import type { Balance } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchBalancesOptions {
  onUpdate: (balances: Balance[]) => void;
}

export function watchBalances(client: Client, opts: WatchBalancesOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchBalances", "M4");
}
