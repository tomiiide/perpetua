import type { BookLevel } from "../contract/index.js";
import { dec, decAdd, decDiv, decGte, decIsZero, decMul, decSub, decToString, ZERO } from "../decimal/index.js";

/** Volume-weighted average price to fill `size`, walking best-first `levels`. */
export function vwap(levels: BookLevel[], size: string): string {
  let remaining = dec(size);
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

  return decToString(decIsZero(filled) ? ZERO : decDiv(notional, filled));
}
