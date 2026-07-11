import type { Market } from "../contract/index.js";
import { dec, decRoundToStep, decToString, type RoundMode } from "../decimal/index.js";

export type { RoundMode } from "../decimal/index.js";

export function tickRound(price: string, market: Pick<Market, "tickSize">, mode: RoundMode): string {
  return decToString(decRoundToStep(dec(price), dec(market.tickSize), mode));
}
