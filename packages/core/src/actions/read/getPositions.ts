import type { Client } from "../../client/index.js";
import type { Position } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getPositions(client: Client, opts?: ActionOptions): Promise<Position[]> {
  void client;
  void opts;
  notImplemented("getPositions", "M4");
}
