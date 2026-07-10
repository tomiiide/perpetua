import type { Client } from "../../client/index.js";
import type { MarketId, MarketStats } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getStats(
  client: Client,
  marketId: MarketId,
  opts?: ActionOptions,
): Promise<MarketStats> {
  void client;
  void marketId;
  void opts;
  notImplemented("getStats", "M2");
}
