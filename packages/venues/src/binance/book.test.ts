import { afterEach, describe, expect, it, vi } from "vitest";
import type { BookEvent, MarketId, VenueEvent } from "@perpetua/core";
import { fetchBookSnapshot, subscribeBook } from "./book.js";
import { createRestClient } from "./rest-client.js";
import { BinanceWsClient } from "./ws-client.js";
import { createFakeNet, settle, type FakeNet } from "./testing/fake-net.js";
import {
  DEPTH_SNAPSHOT,
  DEPTH_SNAPSHOT_AFTER_GAP,
  DEPTH_UPDATE_BRIDGE,
  DEPTH_UPDATE_GAPPED,
  DEPTH_UPDATE_NEXT,
  DEPTH_UPDATE_STALE,
  T0,
} from "./testing/fixtures.js";

const MKT = "binance:BTCUSDT" as MarketId;
const STREAM = "btcusdt@depth@100ms";

function books(events: VenueEvent[]): BookEvent[] {
  return events.flatMap((e) => (e.kind === "book" ? [e.event] : []));
}

function harness(net: FakeNet) {
  vi.stubGlobal("WebSocket", net.WebSocket);
  vi.stubGlobal("fetch", net.fetch);
  const ws = new BinanceWsClient("wss://public.binance.test/stream");
  const rest = createRestClient("https://rest.binance.test");
  const events: VenueEvent[] = [];
  return { ws, rest, events, sink: (e: VenueEvent) => events.push(e) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("fetchBookSnapshot", () => {
  it("maps the REST depth snapshot, seq-stamped with lastUpdateId", async () => {
    const net = createFakeNet({ rest: { "/fapi/v1/depth": () => DEPTH_SNAPSHOT } });
    vi.stubGlobal("fetch", net.fetch);
    const snap = await fetchBookSnapshot(createRestClient("https://rest.binance.test"), MKT);
    expect(snap.type).toBe("snapshot");
    expect(snap.seq).toBe(100);
    expect(snap.ts).toBe(T0);
    expect(snap.bids.map((l) => l.price)).toEqual(["50000", "49999.9", "49999.8"]);
    expect(snap.asks.map((l) => l.size)).toEqual(["0.75", "1.5", "3"]);
    expect(net.restCalls[0]).toEqual({ path: "/fapi/v1/depth", params: { symbol: "BTCUSDT", limit: "1000" } });
  });
});

describe("subscribeBook depth sync", () => {
  it("buffers diffs, snapshots, drops covered updates, and re-stamps a contiguous seq", async () => {
    const net = createFakeNet({ rest: { "/fapi/v1/depth": () => DEPTH_SNAPSHOT } });
    const h = harness(net);
    const off = subscribeBook(h.ws, h.rest, MKT, h.sink);
    await settle();
    const sock = net.sockets[0]!;
    expect(sock.subscribedStreams()).toContain(STREAM);

    sock.emit(STREAM, DEPTH_UPDATE_STALE);
    sock.emit(STREAM, DEPTH_UPDATE_BRIDGE);
    await settle();
    sock.emit(STREAM, DEPTH_UPDATE_NEXT);
    off();

    const evs = books(h.events);
    expect(evs.map((e) => e.type)).toEqual(["snapshot", "diff", "diff"]);
    expect(evs.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(evs.map((e) => e.ts)).toEqual([T0, T0 + 100, T0 + 200]);
    // the stale pre-snapshot update (u < lastUpdateId) never surfaces
    const [, bridge, next] = evs;
    expect(bridge).toMatchObject({
      deltas: [
        { side: "buy", price: "49999.9", size: "0.75" },
        { side: "sell", price: "50000.4", size: "0" },
      ],
    });
    expect(next).toMatchObject({ deltas: [{ side: "buy", price: "49999.7", size: "0.25" }] });
  });

  it("resyncs with a fresh snapshot when pu breaks continuity", async () => {
    let calls = 0;
    const net = createFakeNet({
      rest: { "/fapi/v1/depth": () => (++calls === 1 ? DEPTH_SNAPSHOT : DEPTH_SNAPSHOT_AFTER_GAP) },
    });
    const h = harness(net);
    const off = subscribeBook(h.ws, h.rest, MKT, h.sink);
    await settle();
    const sock = net.sockets[0]!;

    sock.emit(STREAM, DEPTH_UPDATE_BRIDGE);
    await settle();
    sock.emit(STREAM, DEPTH_UPDATE_NEXT);
    sock.emit(STREAM, DEPTH_UPDATE_GAPPED); // pu 112 != 110
    await settle();
    off();

    const evs = books(h.events);
    expect(evs.map((e) => e.type)).toEqual(["snapshot", "diff", "diff", "snapshot", "diff"]);
    expect(evs.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(calls).toBe(2);
    expect(evs[4]).toMatchObject({ deltas: [{ side: "buy", price: "49999.6", size: "1" }] });
  });

  it("resyncs when the stream starts past the snapshot", async () => {
    let calls = 0;
    const net = createFakeNet({
      rest: {
        "/fapi/v1/depth": () =>
          ++calls === 1 ? DEPTH_SNAPSHOT : { ...DEPTH_SNAPSHOT, lastUpdateId: 106, E: T0 + 150 },
      },
    });
    const h = harness(net);
    const off = subscribeBook(h.ws, h.rest, MKT, h.sink);
    await settle();
    const sock = net.sockets[0]!;

    // first event after the snapshot opens at U=103 > lastUpdateId+1=101: events were missed
    sock.emit(STREAM, { ...DEPTH_UPDATE_NEXT, U: 103, u: 107, pu: 102 });
    await settle();
    off();

    const evs = books(h.events);
    expect(evs.map((e) => e.type)).toEqual(["snapshot", "snapshot", "diff"]);
    expect(evs.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(calls).toBe(2);
  });

  it("retries a failed snapshot fetch and then completes the sync", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const net = createFakeNet({
      rest: {
        "/fapi/v1/depth": () => {
          if (++calls === 1) throw new Error("boom");
          return DEPTH_SNAPSHOT;
        },
      },
    });
    const h = harness(net);
    const off = subscribeBook(h.ws, h.rest, MKT, h.sink);
    await settle();
    const sock = net.sockets[0]!;

    sock.emit(STREAM, DEPTH_UPDATE_BRIDGE);
    await settle();
    expect(books(h.events)).toHaveLength(0); // first fetch failed, still buffering

    await vi.advanceTimersByTimeAsync(1_000);
    off();

    const evs = books(h.events);
    expect(evs.map((e) => e.type)).toEqual(["snapshot", "diff"]);
    expect(calls).toBe(2);
  });

  it("emits nothing after unsubscribe, even with a snapshot in flight", async () => {
    const net = createFakeNet({ rest: { "/fapi/v1/depth": () => DEPTH_SNAPSHOT } });
    const h = harness(net);
    const off = subscribeBook(h.ws, h.rest, MKT, h.sink);
    await settle();
    const sock = net.sockets[0]!;

    sock.emit(STREAM, DEPTH_UPDATE_BRIDGE); // snapshot fetch now in flight
    off();
    await settle();
    sock.emit(STREAM, DEPTH_UPDATE_NEXT);
    await settle();

    expect(h.events).toHaveLength(0);
  });
});
