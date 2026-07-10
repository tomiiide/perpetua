import type { Client } from "../../client/index.js";
import type { Funding, MarketId } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getFunding(
  client: Client,
  marketId: MarketId,
  opts?: ActionOptions,
): Promise<Funding> {
  void client;
  void marketId;
  void opts;
  notImplemented("getFunding", "M2");
}
