import type { Market } from "../contract/index.js";
import { dec, decDecimalPlaces } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

export function formatSize(v: string, market: Pick<Market, "lotSize">, locale?: string): FormattedParts {
  const dp = decDecimalPlaces(dec(market.lotSize));
  return splitParts(v, dp, "", "", locale);
}
