import type { BookEvent, EventSink, MarketId, Unsubscribe } from "@perpkit/core";
import { mapBookLevel, mapDepthDeltas, streamName, symbolFromMarketId } from "./mapping.js";
import type { RestClient } from "./rest-client.js";
import type { BnDepthSnapshot, BnDepthUpdate } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

const DEPTH_LIMIT = "1000";
const RESYNC_RETRY_MS = 1_000;

function fetchDepth(rest: RestClient, symbol: string): Promise<BnDepthSnapshot> {
  return rest.get<BnDepthSnapshot>("/fapi/v1/depth", { symbol, limit: DEPTH_LIMIT });
}

function toSnapshotEvent(snap: BnDepthSnapshot, seq: number): BookEvent & { type: "snapshot" } {
  return {
    type: "snapshot",
    seq,
    bids: snap.bids.map(mapBookLevel),
    asks: snap.asks.map(mapBookLevel),
    ts: snap.E,
  };
}

export async function fetchBookSnapshot(
  rest: RestClient,
  marketId: MarketId,
): Promise<BookEvent & { type: "snapshot" }> {
  const symbol = symbolFromMarketId(marketId);
  const snap = await fetchDepth(rest, symbol);
  return toSnapshotEvent(snap, snap.lastUpdateId);
}

/**
 * BookEngine wants a contiguous seq stream, but Binance diffs carry U/u/pu
 * update-id RANGES — so the venue runs Binance's depth-sync protocol here
 * (buffer diffs, REST snapshot, drop u < lastUpdateId, then require
 * pu === previous u) and re-stamps verified events with a synthetic
 * contiguous seq, emitting a fresh snapshot itself whenever the stream gaps.
 */
export function subscribeBook(
  ws: BinanceWsClient,
  rest: RestClient,
  marketId: MarketId,
  sink: EventSink,
): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  let disposed = false;
  let seq = 0;
  let lastU: number | null = null;
  let firstAfterSnapshot = false;
  let buffered: BnDepthUpdate[] | null = null; // non-null while a snapshot fetch is in flight
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const fetchAndEmitSnapshot = (): void => {
    fetchDepth(rest, symbol)
      .then((snap) => {
        if (disposed) return;
        const pending = buffered ?? [];
        buffered = null;
        lastU = snap.lastUpdateId;
        firstAfterSnapshot = true;
        seq += 1;
        sink({ kind: "book", event: toSnapshotEvent(snap, seq) });
        for (const ev of pending) apply(ev);
      })
      .catch(() => {
        if (disposed) return;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          if (buffered !== null) fetchAndEmitSnapshot();
        }, RESYNC_RETRY_MS);
      });
  };

  // Docs-mandated order: buffer stream events, THEN snapshot — at subscribe time it always gaps.
  const startSync = (ev: BnDepthUpdate): void => {
    buffered = [ev];
    lastU = null;
    fetchAndEmitSnapshot();
  };

  const apply = (ev: BnDepthUpdate): void => {
    if (buffered !== null) {
      buffered.push(ev);
      return;
    }
    if (lastU === null) {
      startSync(ev);
      return;
    }
    if (ev.u < lastU) return; // already covered by the snapshot
    if (firstAfterSnapshot) {
      // U == lastU + 1 is contiguous with the snapshot, not a gap
      if (ev.U > lastU + 1) {
        startSync(ev); // stream starts past the snapshot — events were missed
        return;
      }
      firstAfterSnapshot = false;
    } else if (ev.pu !== lastU) {
      startSync(ev);
      return;
    }
    lastU = ev.u;
    seq += 1;
    sink({ kind: "book", event: { type: "diff", seq, deltas: mapDepthDeltas(ev), ts: ev.E } });
  };

  const offWs = ws.subscribe(streamName(symbol, "depth@100ms"), (data) => apply(data as BnDepthUpdate));

  return () => {
    disposed = true;
    if (retryTimer !== null) clearTimeout(retryTimer);
    offWs();
  };
}
