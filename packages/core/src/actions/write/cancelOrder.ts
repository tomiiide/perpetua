import type { Client } from "../../client/index.js";
import { notImplemented } from "../not-implemented.js";

export async function cancelOrder(client: Client, id: string): Promise<void> {
  void client;
  void id;
  notImplemented("cancelOrder", "M4");
}
