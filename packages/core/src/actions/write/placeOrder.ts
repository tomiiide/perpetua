import type { Client } from "../../client/index.js";
import type { OrderAck, OrderRequest } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

export async function placeOrder(client: Client, req: OrderRequest): Promise<OrderAck> {
  void client;
  void req;
  notImplemented("placeOrder", "M4");
}
