import type { Client } from "../../client/index.js";
import type { OrderAck, OrderRequest } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function modifyOrder(
  client: Client,
  id: string,
  req: Partial<OrderRequest>,
): Promise<OrderAck> {
  void client;
  void id;
  void req;
  notImplemented("modifyOrder", "M4");
}
