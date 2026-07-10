import type { Client } from "../../client/index.js";
import type { MarketList } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getMarkets(client: Client, opts?: ActionOptions): Promise<MarketList> {
  void client;
  void opts;
  notImplemented("getMarkets", "M1");
}
