import { dec, decDecimalPlaces, decIsNegative, decIsZero } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

/** +/- sign semantics for PnL, price change, etc. */
export function formatDelta(v: string, locale?: string): FormattedParts {
  const d = dec(v);
  const dp = decIsZero(d) ? 0 : Math.min(decDecimalPlaces(d), 8);
  const forceSign = decIsNegative(d) ? "" : "+";
  return splitParts(v, dp, "", forceSign, locale);
}
