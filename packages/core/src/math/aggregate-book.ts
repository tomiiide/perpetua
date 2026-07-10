import type { BookLevel, Dec, Side } from "../contract/index.js";
import { decAdd, decCmp, decIsZero, decRoundToStep, decToString } from "../decimal/index.js";

/**
 * Derived view over raw levels; grouping conserves total size per side
 * (MODELS.md invariants). Bids bucket down (floor), asks bucket up (ceil),
 * so every bucket price is a "price-or-better" boundary for its side.
 */
export function aggregateBook(levels: BookLevel[], grouping: Dec, side: Side): BookLevel[] {
  if (decIsZero(grouping)) return levels;

  const mode = side === "buy" ? "down" : "up";
  const buckets = new Map<string, BookLevel>();

  for (const level of levels) {
    const bucketPrice = decRoundToStep(level.price, grouping, mode);
    const key = decToString(bucketPrice);
    const existing = buckets.get(key);
    if (existing) {
      existing.size = decAdd(existing.size, level.size);
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
        size: level.size,
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
  return result;
}
