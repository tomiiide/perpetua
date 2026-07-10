import type { BookLevel, Dec, Side } from "../contract/index.js";
import { decAdd, decDiv, decGte, decIsZero, decMul, decSub, decToNumber, ZERO } from "../decimal/index.js";

export interface PriceImpactParams {
  side: Side;
  size: Dec;
  /** best-first: bids desc for a sell, asks asc for a buy. */
  levels: BookLevel[];
}

/** Walks the book consuming `size`; `impactPct` is signed lossy (CORE_SPEC.md §3). */
export function priceImpact(params: PriceImpactParams): { avgPrice: Dec; impactPct: number } {
  const { size, levels } = params;
  if (levels.length === 0 || decIsZero(size)) return { avgPrice: ZERO, impactPct: 0 };

  const bestPrice = levels[0]!.price;
  let remaining = size;
  let notional = ZERO;
  let filled = ZERO;

  for (const level of levels) {
    if (decIsZero(remaining)) break;
    const take = decGte(level.size, remaining) ? remaining : level.size;
    notional = decAdd(notional, decMul(level.price, take));
    filled = decAdd(filled, take);
    remaining = decSub(remaining, take);
  }
  // insufficient depth: `filled` stays short of `size`, avgPrice reflects only what was fillable.

  const avgPrice = decIsZero(filled) ? bestPrice : decDiv(notional, filled);
  const impactPct = decIsZero(bestPrice)
    ? 0
    : decToNumber(decDiv(decSub(avgPrice, bestPrice), bestPrice)) * 100;

  return { avgPrice, impactPct };
}
