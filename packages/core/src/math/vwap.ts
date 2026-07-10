import type { BookLevel, Dec } from "../contract/index.js";
import { decAdd, decDiv, decGte, decIsZero, decMul, decSub, ZERO } from "../decimal/index.js";

/** Volume-weighted average price to fill `size`, walking best-first `levels`. */
export function vwap(levels: BookLevel[], size: Dec): Dec {
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

  return decIsZero(filled) ? ZERO : decDiv(notional, filled);
}
