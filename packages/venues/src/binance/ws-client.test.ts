import { afterEach, describe, expect, it, vi } from "vitest";
import { BinanceWsClient } from "./ws-client.js";
import { createFakeNet, settle } from "./testing/fake-net.js";

const URL = "wss://fake.binance.test/stream";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("BinanceWsClient", () => {
  it("multiplexes one socket and subscribes each stream once", async () => {
    const net = createFakeNet();
    vi.stubGlobal("WebSocket", net.WebSocket);
    const client = new BinanceWsClient(URL);

    const seenA: unknown[] = [];
    const seenB: unknown[] = [];
    const seenC: unknown[] = [];
    client.subscribe("btcusdt@aggTrade", (d) => seenA.push(d));
    client.subscribe("btcusdt@aggTrade", (d) => seenB.push(d));
    client.subscribe("ethusdt@aggTrade", (d) => seenC.push(d));
    await settle();

    expect(net.sockets).toHaveLength(1);
    const sock = net.sockets[0]!;
    const streams = sock.subscribedStreams();
    expect(streams.filter((s) => s === "btcusdt@aggTrade")).toHaveLength(1);
    expect(streams).toContain("ethusdt@aggTrade");

    sock.emit("btcusdt@aggTrade", { p: "1" });
    sock.emit("ethusdt@aggTrade", { p: "2" });
    expect(seenA).toEqual([{ p: "1" }]);
    expect(seenB).toEqual([{ p: "1" }]);
    expect(seenC).toEqual([{ p: "2" }]);
  });

  it("ignores acks, unknown streams, and malformed frames", async () => {
    const net = createFakeNet();
    vi.stubGlobal("WebSocket", net.WebSocket);
    const client = new BinanceWsClient(URL);
    const seen: unknown[] = [];
    client.subscribe("btcusdt@aggTrade", (d) => seen.push(d));
    await settle();
    const sock = net.sockets[0]!;

    sock.emitRaw(JSON.stringify({ result: null, id: 1 })); // subscribe ack
    sock.emit("nobody@home", { p: "x" });
    sock.emitRaw("{not json");
    expect(seen).toEqual([]);
  });

  it("unsubscribes the stream and closes the socket when idle", async () => {
    const net = createFakeNet();
    vi.stubGlobal("WebSocket", net.WebSocket);
    const client = new BinanceWsClient(URL);
    const off = client.subscribe("btcusdt@aggTrade", () => {});
    await settle();
    const sock = net.sockets[0]!;

    off();
    expect(sock.sent.some((f) => f.method === "UNSUBSCRIBE" && f.params?.includes("btcusdt@aggTrade"))).toBe(true);
    expect(sock.readyState).toBe(3); // CLOSED
  });

  it("keeps the socket while other handlers remain on the stream", async () => {
    const net = createFakeNet();
    vi.stubGlobal("WebSocket", net.WebSocket);
    const client = new BinanceWsClient(URL);
    const seen: unknown[] = [];
    const offA = client.subscribe("btcusdt@aggTrade", () => {});
    client.subscribe("btcusdt@aggTrade", (d) => seen.push(d));
    await settle();
    const sock = net.sockets[0]!;

    offA();
    expect(sock.readyState).toBe(1); // OPEN
    sock.emit("btcusdt@aggTrade", { p: "3" });
    expect(seen).toEqual([{ p: "3" }]);
  });

  it("reconnects after a drop and resubscribes all channels", async () => {
    vi.useFakeTimers();
    const net = createFakeNet();
    vi.stubGlobal("WebSocket", net.WebSocket);
    const client = new BinanceWsClient(URL);
    const seen: unknown[] = [];
    client.subscribe("btcusdt@aggTrade", (d) => seen.push(d));
    client.subscribe("ethusdt@ticker", () => {});
    await vi.advanceTimersByTimeAsync(0);

    net.sockets[0]!.drop();
    // first backoff is 500ms plus up to 50% jitter
    await vi.advanceTimersByTimeAsync(1_000);

    expect(net.sockets).toHaveLength(2);
    const sock2 = net.sockets[1]!;
    expect(sock2.subscribedStreams().sort()).toEqual(["btcusdt@aggTrade", "ethusdt@ticker"]);
    sock2.emit("btcusdt@aggTrade", { p: "4" });
    expect(seen).toEqual([{ p: "4" }]);
  });
});
