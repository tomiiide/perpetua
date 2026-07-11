import type { Market } from "../contract/index.js";
import { dec, decRoundToStep, decToString, type RoundMode } from "../decimal/index.js";

export function lotRound(size: string, market: Pick<Market, "lotSize">, mode: RoundMode): string {
  return decToString(decRoundToStep(dec(size), dec(market.lotSize), mode));
}
