import type { Client } from "../../client/index.js";
import type { OrderAck, TriggerRequest } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function placeTrigger(client: Client, req: TriggerRequest): Promise<OrderAck> {
  void client;
  void req;
  notImplemented("placeTrigger", "M4");
}
