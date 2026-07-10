import type { Client } from "../../client/index.js";
import type { MarketId } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function setMarginMode(
  client: Client,
  marketId: MarketId,
  mode: "cross" | "isolated",
): Promise<void> {
  void client;
  void marketId;
  void mode;
  notImplemented("setMarginMode", "M4");
}
