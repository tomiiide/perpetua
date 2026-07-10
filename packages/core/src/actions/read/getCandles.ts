import type { Client } from "../../client/index.js";
import type { Candle, MarketId, Resolution } from "../../contract/index.js";
import type { Range } from "../../contract/venue.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getCandles(
  client: Client,
  marketId: MarketId,
  resolution: Resolution,
  range: Range,
  opts?: ActionOptions,
): Promise<Candle[]> {
  void client;
  void marketId;
  void resolution;
  void range;
  void opts;
  notImplemented("getCandles", "M2");
}
