import { describe, expect, it } from "vitest";
import type { MarketId } from "@perpetua/core";
import {
  mapAggTrade,
  mapBookLevel,
  mapDepthDeltas,
  mapForceOrder,
  mapKlineRow,
  mapMarket,
  mapPrices,
  mapWsKline,
  streamName,
  symbolFromMarketId,
  toMarketId,
} from "./mapping.js";
import { fetchMarkets } from "./markets.js";
import type { BnExchangeSymbol, BnKlineRow } from "./types.js";
import {
  AGG_TRADE,
  DEPTH_UPDATE_BRIDGE,
  EXCHANGE_INFO,
  FORCE_ORDER,
  MARK_PRICE,
  T0,
  WS_KLINE,
} from "./testing/fixtures.js";

const BTC = EXCHANGE_INFO.symbols[0]!;

describe("symbol mapping", () => {
  it("round-trips symbol -> MarketId -> symbol", () => {
    const id = toMarketId("BTCUSDT");
    expect(id).toBe("binance:BTCUSDT");
    expect(symbolFromMarketId(id)).toBe("BTCUSDT");
  });

  it("rejects a foreign MarketId", () => {
    expect(() => symbolFromMarketId("hyperliquid:BTC" as MarketId)).toThrow(/not a binance MarketId/);
  });

  it("builds lowercase combined-stream names", () => {
    expect(streamName("BTCUSDT", "depth@100ms")).toBe("btcusdt@depth@100ms");
    expect(streamName("ETHUSDT", "aggTrade")).toBe("ethusdt@aggTrade");
  });
});

describe("mapMarket", () => {
  it("maps a perp symbol with normalized decimal strings", () => {
    const m = mapMarket(BTC);
    expect(m).toEqual({
      id: "binance:BTCUSDT",
      symbol: "BTC-PERP",
      base: "BTC",
      quote: "USDT",
      type: "perp",
      tickSize: "0.1", // "0.10" on the wire
      lotSize: "0.001",
      minNotional: "100",
      maxLeverage: null,
      makerFee: "0.0002",
      takerFee: "0.0005",
    });
  });

  it("returns null when price or lot filters are missing", () => {
    const bare = EXCHANGE_INFO.symbols.find((s) => s.symbol === "BAREUSDT")!;
    expect(mapMarket(bare)).toBeNull();
  });

  it("maps a missing MIN_NOTIONAL filter to null", () => {
    const quarterly = EXCHANGE_INFO.symbols.find((s) => s.symbol === "BTCUSDT_260327")!;
    expect(mapMarket(quarterly)?.minNotional).toBeNull();
  });
});

describe("fetchMarkets", () => {
  it("keeps only TRADING perpetuals with usable filters", async () => {
    const rest = { get: async <T>(): Promise<T> => EXCHANGE_INFO as T };
    const markets = await fetchMarkets(rest);
    expect(markets.map((m) => m.id)).toEqual(["binance:BTCUSDT", "binance:ETHUSDT"]);
  });
});

describe("book mapping", () => {
  it("normalizes level price/size strings", () => {
    expect(mapBookLevel(["50000.0", "1.000"])).toEqual({
      price: "50000",
      size: "1",
      orderCount: null,
      minExpiry: null,
    });
  });

  it("maps bid/ask arrays to sided deltas, keeping zero sizes as removals", () => {
    expect(mapDepthDeltas(DEPTH_UPDATE_BRIDGE)).toEqual([
      { side: "buy", price: "49999.9", size: "0.75" },
      { side: "sell", price: "50000.4", size: "0" },
    ]);
  });
});

describe("trade mapping", () => {
  it("maps aggTrade with buyer-is-maker meaning an aggressive sell", () => {
    expect(mapAggTrade(AGG_TRADE)).toEqual({
      id: "26129",
      marketId: "binance:BTCUSDT",
      price: "50000.1",
      size: "0.004",
      side: "sell",
      ts: T0 + 49,
      synthetic: false,
    });
  });

  it("maps buyer-as-taker to a buy", () => {
    expect(mapAggTrade({ ...AGG_TRADE, m: false }).side).toBe("buy");
  });

  it("maps a forceOrder liquidation using the average fill price", () => {
    expect(mapForceOrder(FORCE_ORDER)).toEqual({
      id: `ETHUSDT-${T0 + 2999}`,
      marketId: "binance:ETHUSDT",
      price: "3000.5",
      size: "2.5",
      side: "buy",
      ts: T0 + 2999,
      synthetic: false,
    });
  });
});

describe("candle mapping", () => {
  it("maps a ws kline preserving open/closed state", () => {
    const c = mapWsKline(WS_KLINE.k);
    expect(c).toEqual({
      ts: WS_KLINE.k.t,
      open: "50000",
      high: "50010",
      low: "49990",
      close: "50005",
      volume: "12.345",
      closed: false,
    });
  });

  it("maps a REST kline row, deriving closed from closeTime", () => {
    const past: BnKlineRow = [T0, "1.10", "1.20", "1.00", "1.15", "10.0", T0 + 59_999, "11.5", 3, "5.0", "5.75", "0"];
    expect(mapKlineRow(past)).toEqual({
      ts: T0,
      open: "1.1",
      high: "1.2",
      low: "1",
      close: "1.15",
      volume: "10",
      closed: true,
    });

    const futureClose = Date.now() + 60_000;
    const open: BnKlineRow = [futureClose - 60_000, "1", "1", "1", "1", "0", futureClose, "0", 0, "0", "0", "0"];
    expect(mapKlineRow(open).closed).toBe(false);
  });
});

describe("price mapping", () => {
  it("maps mark/index and leaves oracle null", () => {
    expect(mapPrices(MARK_PRICE)).toEqual({
      mark: "50001.1",
      index: "50000.9",
      oracle: null,
      ts: T0 + 1000,
      stale: false,
    });
  });
});

describe("decimal string handling", () => {
  it("never emits exponential notation and preserves exact precision", () => {
    const level = mapBookLevel(["0.00001230", "123456789.10000000"]);
    expect(level.price).toBe("0.0000123");
    expect(level.size).toBe("123456789.1");
    const tiny = mapBookLevel(["1e-7", "2.5e2"]);
    expect(tiny.price).toBe("0.0000001");
    expect(tiny.size).toBe("250");
  });
});

describe("wire-shape guard", () => {
  it("mapMarket reads filters positionally-independent of order", () => {
    const shuffled: BnExchangeSymbol = {
      ...BTC,
      filters: [...BTC.filters].reverse(),
    };
    expect(mapMarket(shuffled)?.tickSize).toBe("0.1");
    expect(mapMarket(shuffled)?.lotSize).toBe("0.001");
  });
});
