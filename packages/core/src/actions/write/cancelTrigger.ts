import type { Client } from "../../client/index.js";
import { notImplemented } from "../not-implemented.js";

export async function cancelTrigger(client: Client, id: string): Promise<void> {
  void client;
  void id;
  notImplemented("cancelTrigger", "M4");
}
