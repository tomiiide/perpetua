import type { Market } from "../contract/index.js";
import { dec, decDecimalPlaces } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

/** Tick-aware precision — derives decimal places from `market.tickSize`. */
export function formatPrice(v: string, market: Pick<Market, "tickSize">, locale?: string): FormattedParts {
  const dp = decDecimalPlaces(dec(market.tickSize));
  return splitParts(v, dp, "", "", locale);
}
