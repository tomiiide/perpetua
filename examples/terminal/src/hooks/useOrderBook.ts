import { useEffect, useState } from "react";
import type { BookState, MarketId } from "@perpetua/core";
import { watchOrderBook } from "@perpetua/core";
import { client } from "../lib/perpetua";

export function useOrderBook(marketId: MarketId | null, grouping?: string, depth = 13): BookState | null {
  const [book, setBook] = useState<BookState | null>(null);
  useEffect(() => {
    if (!marketId) return;
    setBook(null);
    const off = watchOrderBook(client, {
      marketId,
      depth,
      onUpdate: setBook,
      ...(grouping ? { grouping } : {}),
    });
    return off;
  }, [marketId, grouping, depth]);
  return book;
}
