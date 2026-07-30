import { afterEach, describe, expect, it, vi } from "vitest";
import { runConformance } from "@perpetua/core/testing";
import { binance } from "./index.js";
import { createFakeNet } from "./testing/fake-net.js";
import {
  AGG_TRADE,
  DEPTH_SNAPSHOT,
  DEPTH_UPDATE_BRIDGE,
  DEPTH_UPDATE_NEXT,
  DEPTH_UPDATE_STALE,
  EXCHANGE_INFO,
  klineRows,
} from "./testing/fixtures.js";

/**
 * Fixture-backed transport for the whole venue: depth diffs replay on every
 * SUBSCRIBE (they land before the REST snapshot resolves, exercising the
 * documented buffer-then-snapshot sync), REST serves captured payloads.
 */
function fixtureNet() {
  return createFakeNet({
    replay: {
      "btcusdt@depth@100ms": [DEPTH_UPDATE_STALE, DEPTH_UPDATE_BRIDGE, DEPTH_UPDATE_NEXT],
      "btcusdt@aggTrade": [AGG_TRADE],
    },
    rest: {
      "/fapi/v1/exchangeInfo": () => EXCHANGE_INFO,
      "/fapi/v1/depth": () => DEPTH_SNAPSHOT,
      "/fapi/v1/klines": (p) => klineRows(Number(p.startTime), Number(p.endTime), p.interval ?? "1m"),
    },
  });
}

function fixtureVenue(net = fixtureNet()) {
  vi.stubGlobal("WebSocket", net.WebSocket);
  vi.stubGlobal("fetch", net.fetch);
  return binance({
    restUrl: "https://rest.binance.test",
    wsPublicUrl: "wss://public.binance.test/stream",
    wsMarketUrl: "wss://market.binance.test/stream",
  }).market;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("binance venue conformance (fixture-fed, no network)", () => {
  it("passes every Tier A invariant", async () => {
    const report = await runConformance(fixtureVenue());
    expect(report.venue).toBe("binance");
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checks).toBeGreaterThan(50);
  });

  it("is deterministic across runs against the same fixtures", async () => {
    const a = await runConformance(fixtureVenue());
    vi.unstubAllGlobals();
    const b = await runConformance(fixtureVenue());
    expect(b.checks).toBe(a.checks);
    expect(b.failures).toEqual(a.failures);
  });
});
