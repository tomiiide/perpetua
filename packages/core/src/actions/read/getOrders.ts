import type { Client } from "../../client/index.js";
import type { HistoryQuery, Order, Page } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getOrders(
  client: Client,
  query: HistoryQuery,
  opts?: ActionOptions,
): Promise<Page<Order>> {
  void client;
  void query;
  void opts;
  notImplemented("getOrders", "M4");
}
