import { useEffect, useState } from "react";
import type { MarketId, Trade } from "@perpetua/core";
import { client } from "../lib/perpetua";

export function useTrades(marketId: MarketId | null, max = 48): Trade[] {
  const [trades, setTrades] = useState<Trade[]>([]);
  useEffect(() => {
    if (!marketId) return;
    setTrades([]);
    const off = client.market.subscribe({ kind: "trades", marketId }, (e) => {
      if (e.kind !== "trades") return;
      setTrades((prev) => {
        const incoming = [...e.trades].reverse();
        return incoming.concat(prev).slice(0, max);
      });
    });
    return off;
  }, [marketId, max]);
  return trades;
}
