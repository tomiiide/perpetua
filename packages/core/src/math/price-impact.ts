import type { BookLevel, Side } from "../contract/index.js";
import { dec, decAdd, decDiv, decGte, decIsZero, decMul, decSub, decToNumber, decToString, ZERO } from "../decimal/index.js";

export interface PriceImpactParams {
  side: Side;
  size: string;
  /** best-first: bids desc for a sell, asks asc for a buy. */
  levels: BookLevel[];
}

/** Walks the book consuming `size`; `impactPct` is signed lossy (CORE_SPEC.md §3). */
export function priceImpact(params: PriceImpactParams): { avgPrice: string; impactPct: number } {
  const { levels } = params;
  const size = dec(params.size);
  if (levels.length === 0 || decIsZero(size)) return { avgPrice: decToString(ZERO), impactPct: 0 };

  const bestPrice = dec(levels[0]!.price);
  let remaining = size;
  let notional = ZERO;
  let filled = ZERO;

  for (const level of levels) {
    if (decIsZero(remaining)) break;
    const levelSize = dec(level.size);
    const take = decGte(levelSize, remaining) ? remaining : levelSize;
    notional = decAdd(notional, decMul(dec(level.price), take));
    filled = decAdd(filled, take);
    remaining = decSub(remaining, take);
  }
  // insufficient depth: `filled` stays short of `size`, avgPrice reflects only what was fillable.

  const avgPrice = decIsZero(filled) ? bestPrice : decDiv(notional, filled);
  const impactPct = decIsZero(bestPrice)
    ? 0
    : decToNumber(decDiv(decSub(avgPrice, bestPrice), bestPrice)) * 100;

  return { avgPrice: decToString(avgPrice), impactPct };
}
