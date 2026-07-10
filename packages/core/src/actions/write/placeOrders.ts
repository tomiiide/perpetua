import type { Client } from "../../client/index.js";
import type { OrderAck, OrderRequest } from "../../contract/index.js";
import { notImplemented } from "../not-implemented.js";

/** Capability-gated on `Capabilities.batchOrders`. */
export async function placeOrders(client: Client, reqs: OrderRequest[]): Promise<OrderAck[]> {
  void client;
  void reqs;
  notImplemented("placeOrders", "M4");
}
