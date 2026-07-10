import type { Client } from "../../client/index.js";
import type { BookState, MarketId } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getBookSnapshot(
  client: Client,
  marketId: MarketId,
  opts?: ActionOptions,
): Promise<BookState> {
  void client;
  void marketId;
  void opts;
  notImplemented("getBookSnapshot", "M1");
}
