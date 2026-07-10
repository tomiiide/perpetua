import type { Client } from "../../client/index.js";
import type { Balance } from "../../contract/index.js";
import type { ActionOptions } from "../types.js";
import { notImplemented } from "../not-implemented.js";

export async function getBalances(client: Client, opts?: ActionOptions): Promise<Balance[]> {
  void client;
  void opts;
  notImplemented("getBalances", "M4");
}
