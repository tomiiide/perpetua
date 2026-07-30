import { afterEach, describe, expect, it, vi } from "vitest";
import type { MarketId, VenueEvent } from "@perpkit/core";
import { binance } from "./index.js";
import { createFakeNet, settle, type FakeNet } from "./testing/fake-net.js";
import { AGG_TRADE, FORCE_ORDER, klineRows, MARK_PRICE, T0, TICKER_24H, WS_KLINE } from "./testing/fixtures.js";

const REST = "https://rest.binance.test";
const WS_PUBLIC = "wss://public.binance.test/stream";
const WS_MARKET = "wss://market.binance.test/stream";
const MKT = "binance:BTCUSDT" as MarketId;

function venueOn(net: FakeNet) {
  vi.stubGlobal("WebSocket", net.WebSocket);
  vi.stubGlobal("fetch", net.fetch);
  return binance({ restUrl: REST, wsPublicUrl: WS_PUBLIC, wsMarketUrl: WS_MARKET }).market;
}

// distributes so kinds sharing a member (markPrice | indexPrice) still narrow
type EventOf<K extends VenueEvent["kind"], E = VenueEvent> = E extends { kind: string }
  ? K extends E["kind"]
    ? E
    : never
  : never;

function ofKind<K extends VenueEvent["kind"]>(events: VenueEvent[], kind: K) {
  return events.filter((e): e is EventOf<K> => e.kind === kind);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("binance market-data streams", () => {
  it("maps aggTrade pushes into trades events", async () => {
    const net = createFakeNet({ replay: { "btcusdt@aggTrade": [AGG_TRADE] } });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const off = venue.subscribe({ kind: "trades", marketId: MKT }, (e) => events.push(e));
    await settle();
    off();

    const trades = ofKind(events, "trades");
    expect(trades).toHaveLength(1);
    expect(trades[0]!.trades[0]).toMatchObject({ id: "26129", price: "50000.1", side: "sell" });
  });

  it("maps kline pushes into candle events", async () => {
    const net = createFakeNet({ replay: { "btcusdt@kline_1m": [WS_KLINE] } });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const off = venue.subscribe({ kind: "candle", marketId: MKT, resolution: "1m" }, (e) => events.push(e));
    await settle();
    off();

    const candles = ofKind(events, "candle");
    expect(candles).toHaveLength(1);
    expect(candles[0]!.candle).toMatchObject({ open: "50000", close: "50005", closed: false });
  });

  it("serves markPrice and indexPrice from the single markPrice stream", async () => {
    const net = createFakeNet({ replay: { "btcusdt@markPrice@1s": [MARK_PRICE] } });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const offMark = venue.subscribe({ kind: "markPrice", marketId: MKT }, (e) => events.push(e));
    const offIndex = venue.subscribe({ kind: "indexPrice", marketId: MKT }, (e) => events.push(e));
    await settle();
    offMark();
    offIndex();

    const sock = net.socketFor(WS_MARKET)!;
    expect(sock.subscribedStreams().filter((s) => s === "btcusdt@markPrice@1s")).toHaveLength(1);
    expect(ofKind(events, "markPrice")[0]!.prices).toMatchObject({ mark: "50001.1", index: "50000.9", oracle: null });
    expect(ofKind(events, "indexPrice")[0]!.prices).toMatchObject({ mark: "50001.1", index: "50000.9" });
  });

  it("emits funding with the interval backfilled from fundingInfo", async () => {
    const net = createFakeNet({
      rest: { "/fapi/v1/fundingInfo": () => [{ symbol: "BTCUSDT", fundingIntervalHours: 4 }] },
    });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const off = venue.subscribe({ kind: "funding", marketId: MKT }, (e) => events.push(e));
    await settle(); // fundingInfo backfill lands before the first push
    net.socketFor(WS_MARKET)!.emit("btcusdt@markPrice@1s", MARK_PRICE);
    off();

    const funding = ofKind(events, "funding");
    expect(funding).toHaveLength(1);
    expect(funding[0]!.funding).toEqual({
      rate: "0.0001",
      predicted: null,
      nextAt: T0 + 3_600_000,
      indexCum: null,
      intervalUs: 4 * 3_600_000 * 1000,
      ts: T0 + 1000,
    });
  });

  it("emits stats with open interest backfilled from REST", async () => {
    const net = createFakeNet({
      rest: { "/fapi/v1/openInterest": () => ({ openInterest: "12345.678", symbol: "BTCUSDT", time: T0 }) },
    });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const off = venue.subscribe({ kind: "stats", marketId: MKT }, (e) => events.push(e));
    await settle();
    net.socketFor(WS_MARKET)!.emit("btcusdt@ticker", TICKER_24H);
    off();

    const stats = ofKind(events, "stats");
    expect(stats).toHaveLength(1);
    expect(stats[0]!.stats).toEqual({
      vol24h: "6000000000",
      high24h: "50500",
      low24h: "49000",
      change24hPct: 1.01,
      openInterest: "12345.678",
      lastPrice: "50000.1",
      ts: T0 + 2000,
    });
  });

  it("maps forceOrder pushes into liquidations events", async () => {
    const net = createFakeNet({ replay: { "!forceOrder@arr": [FORCE_ORDER] } });
    const venue = venueOn(net);
    const events: VenueEvent[] = [];
    const off = venue.subscribe({ kind: "liquidations" }, (e) => events.push(e));
    await settle();
    off();

    const liqs = ofKind(events, "liquidations");
    expect(liqs).toHaveLength(1);
    expect(liqs[0]!.trades[0]).toMatchObject({ marketId: "binance:ETHUSDT", price: "3000.5", side: "buy" });
  });

  it("fetches and maps candles over REST", async () => {
    const net = createFakeNet({
      rest: { "/fapi/v1/klines": (p) => klineRows(Number(p.startTime), Number(p.endTime), p.interval ?? "1m") },
    });
    const venue = venueOn(net);
    const candles = await venue.fetchCandles(MKT, "1m", { from: T0, to: T0 + 300_000 });

    expect(candles.length).toBeGreaterThan(3);
    expect(candles[0]!).toMatchObject({ open: "50000", high: "50010", low: "49990", close: "50005", closed: true });
    expect(candles.every((c, i, all) => i === 0 || c.ts > all[i - 1]!.ts)).toBe(true);
    expect(net.restCalls[0]!.params).toMatchObject({ symbol: "BTCUSDT", interval: "1m" });
  });
});
