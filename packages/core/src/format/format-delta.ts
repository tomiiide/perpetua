import type { Dec } from "../contract/index.js";
import { decDecimalPlaces, decIsNegative, decIsZero } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

/** +/- sign semantics for PnL, price change, etc. */
export function formatDelta(v: Dec, locale?: string): FormattedParts {
  const dp = decIsZero(v) ? 0 : Math.min(decDecimalPlaces(v), 8);
  const forceSign = decIsNegative(v) ? "" : "+";
  return splitParts(v, dp, "", forceSign, locale);
}
