import type { Dec, Market } from "../contract/index.js";
import { decDecimalPlaces } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

export function formatSize(v: Dec, market: Pick<Market, "lotSize">, locale?: string): FormattedParts {
  const dp = decDecimalPlaces(market.lotSize);
  return splitParts(v, dp, "", "", locale);
}
