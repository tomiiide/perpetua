import type { Client } from "../../client/index.js";
import type { BookState, MarketId } from "../../contract/index.js";
import type { Unwatch } from "../types.js";
import { BookEngine } from "../../engines/book-engine.js";
import { realScheduler } from "../../engines/scheduler.js";

export interface WatchOrderBookOptions {
  marketId: MarketId;
  grouping?: string;
  depth?: number;
  frameBudget?: number;
  onUpdate: (book: BookState) => void;
}

export function watchOrderBook(client: Client, opts: WatchOrderBookOptions): Unwatch {
  const { market } = client;
  let disposed = false;
  let off: Unwatch = () => {};
  let engine: BookEngine | null = null;

  const requestSnapshot = (): void => {
    market
      .fetchBookSnapshot(opts.marketId)
      .then((snap) => {
        if (!disposed) engine?.applyEvent(snap);
      })
      .catch(() => {});
  };

  void market.markets().then((markets) => {
    if (disposed) return;
    const m = markets.find((mk) => mk.id === opts.marketId);
    if (!m) return;

    engine = new BookEngine({
      marketId: opts.marketId,
      tickSize: m.tickSize,
      lotSize: m.lotSize,
      hasSequence: market.capabilities().sequenceNumbers,
      scheduler: realScheduler(),
      onState: opts.onUpdate,
      requestSnapshot,
      ...(opts.grouping !== undefined ? { grouping: opts.grouping } : {}),
      ...(opts.depth !== undefined ? { depth: opts.depth } : {}),
      ...(opts.frameBudget !== undefined ? { frameBudget: opts.frameBudget } : {}),
    });

    off = market.subscribe({ kind: "book", marketId: opts.marketId }, (e) => {
      if (e.kind === "book") engine?.applyEvent(e.event);
    });
    if (market.capabilities().bookFeed === "pollSnapshot") requestSnapshot();
  });

  return () => {
    disposed = true;
    off();
    engine?.dispose();
  };
}
