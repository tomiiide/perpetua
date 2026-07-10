import type { Client } from "../../client/index.js";
import type { Trigger } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getTriggers(client: Client, opts?: ActionOptions): Promise<Trigger[]> {
  void client;
  void opts;
  notImplemented("getTriggers", "M4");
}
