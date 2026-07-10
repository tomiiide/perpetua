import type { Dec, Market } from "../contract/index.js";
import { decDecimalPlaces } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

/** Tick-aware precision — derives decimal places from `market.tickSize`. */
export function formatPrice(v: Dec, market: Pick<Market, "tickSize">, locale?: string): FormattedParts {
  const dp = decDecimalPlaces(market.tickSize);
  return splitParts(v, dp, "", "", locale);
}
