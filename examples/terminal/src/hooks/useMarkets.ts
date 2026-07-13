import { useEffect, useState } from "react";
import type { Market } from "@perpetua/core";
import { client } from "../lib/perpetua";

export function useMarkets(): Market[] {
  const [markets, setMarkets] = useState<Market[]>([]);
  useEffect(() => {
    let alive = true;
    client.market
      .markets()
      .then((m) => {
        if (alive) setMarkets(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return markets;
}
