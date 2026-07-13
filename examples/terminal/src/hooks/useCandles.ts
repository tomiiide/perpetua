import { useEffect, useState } from "react";
import type { Candle, MarketId, Resolution } from "@perpetua/core";
import { client } from "../lib/perpetua";

const RESOLUTION_MS: Record<Resolution, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "2h": 7_200_000,
  "4h": 14_400_000,
  "8h": 28_800_000,
  "12h": 43_200_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
  "1M": 2_592_000_000,
};

function mergeCandle(prev: Candle[], next: Candle, max: number): Candle[] {
  const last = prev[prev.length - 1];
  if (last && last.ts === next.ts) {
    const copy = prev.slice();
    copy[copy.length - 1] = next;
    return copy;
  }
  return prev.concat(next).slice(-max);
}

export function useCandles(marketId: MarketId | null, resolution: Resolution, count = 140): Candle[] {
  const [candles, setCandles] = useState<Candle[]>([]);
  useEffect(() => {
    if (!marketId) return;
    let alive = true;
    setCandles([]);
    const now = Date.now();
    const from = now - RESOLUTION_MS[resolution] * count;
    client.market
      .fetchCandles(marketId, resolution, { from, to: now })
      .then((c) => {
        if (alive) setCandles(c.slice(-count));
      })
      .catch(() => {});
    const off = client.market.subscribe({ kind: "candle", marketId, resolution }, (e) => {
      if (e.kind !== "candle") return;
      setCandles((prev) => mergeCandle(prev, e.candle, count));
    });
    return () => {
      alive = false;
      off();
    };
  }, [marketId, resolution, count]);
  return candles;
}
