import type { Client } from "../../client/index.js";
import type { Order } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export interface WatchOrdersOptions {
  onUpdate: (orders: Order[]) => void;
}

export function watchOrders(client: Client, opts: WatchOrdersOptions): Unwatch {
  void client;
  void opts;
  notImplemented("watchOrders", "M4 — BlotterEngine");
}
