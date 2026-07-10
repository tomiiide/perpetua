import type { Client } from "../../client/index.js";
import type { MarketId } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function cancelAll(client: Client, marketId?: MarketId): Promise<void> {
  void client;
  void marketId;
  notImplemented("cancelAll", "M4");
}
