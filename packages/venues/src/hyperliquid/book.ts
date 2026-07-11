import type { BookEvent, EventSink, MarketId, Unsubscribe } from "@perpetua/core";
import { coinFromMarketId, mapBookSnapshot } from "./mapping.js";
import type { InfoClient } from "./info-client.js";
import type { HlL2Book } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

export async function fetchBookSnapshot(
  info: InfoClient,
  marketId: MarketId,
): Promise<BookEvent & { type: "snapshot" }> {
  const coin = coinFromMarketId(marketId);
  const book = await info.post<HlL2Book>({ type: "l2Book", coin });
  return mapBookSnapshot(book);
}

/** HL's l2Book websocket channel pushes a full snapshot on every update, never a diff. */
export function subscribeBook(ws: HlWsClient, marketId: MarketId, sink: EventSink): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  return ws.subscribe({ type: "l2Book", coin }, (data) => {
    const event = mapBookSnapshot(data as HlL2Book);
    sink({ kind: "book", event });
  });
}
