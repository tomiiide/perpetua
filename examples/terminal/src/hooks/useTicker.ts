import { useEffect, useState } from "react";
import type { Funding, MarketId, MarketStats, Prices } from "@perpetua/core";
import { client } from "../lib/perpetua";

export interface Ticker {
  prices: Prices | null;
  stats: MarketStats | null;
  funding: Funding | null;
}

export function useTicker(marketId: MarketId | null): Ticker {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [funding, setFunding] = useState<Funding | null>(null);

  useEffect(() => {
    if (!marketId) return;
    setPrices(null);
    setStats(null);
    setFunding(null);
    const offs = [
      client.market.subscribe({ kind: "markPrice", marketId }, (e) => {
        if (e.kind === "markPrice") setPrices(e.prices);
      }),
      client.market.subscribe({ kind: "stats", marketId }, (e) => {
        if (e.kind === "stats") setStats(e.stats);
      }),
      client.market.subscribe({ kind: "funding", marketId }, (e) => {
        if (e.kind === "funding") setFunding(e.funding);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [marketId]);

  return { prices, stats, funding };
}
