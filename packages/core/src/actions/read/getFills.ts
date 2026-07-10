import type { Client } from "../../client/index.js";
import type { Fill, HistoryQuery, Page } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getFills(
  client: Client,
  query: HistoryQuery,
  opts?: ActionOptions,
): Promise<Page<Fill>> {
  void client;
  void query;
  void opts;
  notImplemented("getFills", "M4");
}
