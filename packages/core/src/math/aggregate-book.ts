import type { BookLevel, Side } from "../contract/index.js";
import { dec, decAdd, decCmp, decIsZero, decRoundToStep, decToString, type Dec } from "../decimal/index.js";

/**
 * Derived view over raw levels; grouping conserves total size per side
 * (MODELS.md invariants). Bids bucket down (floor), asks bucket up (ceil),
 * so every bucket price is a "price-or-better" boundary for its side.
 */
export function aggregateBook(levels: BookLevel[], grouping: string, side: Side): BookLevel[] {
  const g = dec(grouping);
  if (decIsZero(g)) return levels;

  const mode = side === "buy" ? "down" : "up";
  const buckets = new Map<string, { price: Dec; size: Dec; orderCount: number | null; minExpiry: number | null }>();

  for (const level of levels) {
    const bucketPrice = decRoundToStep(dec(level.price), g, mode);
    const key = decToString(bucketPrice);
    const existing = buckets.get(key);
    if (existing) {
      existing.size = decAdd(existing.size, dec(level.size));
      existing.orderCount =
        existing.orderCount === null || level.orderCount === null
          ? null
          : existing.orderCount + level.orderCount;
      existing.minExpiry =
        existing.minExpiry === null
          ? level.minExpiry
          : level.minExpiry === null
            ? existing.minExpiry
            : Math.min(existing.minExpiry, level.minExpiry);
    } else {
      buckets.set(key, {
        price: bucketPrice,
        size: dec(level.size),
        orderCount: level.orderCount,
        minExpiry: level.minExpiry,
      });
    }
  }

  const result = [...buckets.values()];
  result.sort((a, b) => {
    const cmp = decCmp(a.price, b.price);
    return side === "buy" ? -cmp : cmp;
  });
  return result.map((b) => ({
    price: decToString(b.price),
    size: decToString(b.size),
    orderCount: b.orderCount,
    minExpiry: b.minExpiry,
  }));
}
