import type { Client } from "../../client/index.js";
import type { MarketId } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function setLeverage(
  client: Client,
  marketId: MarketId,
  leverage: number,
  mode: "cross" | "isolated",
): Promise<void> {
  void client;
  void marketId;
  void leverage;
  void mode;
  notImplemented("setLeverage", "M4");
}
