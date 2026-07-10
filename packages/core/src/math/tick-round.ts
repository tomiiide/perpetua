import type { Dec, Market } from "../contract/index.js";
import { decRoundToStep, type RoundMode } from "../decimal/index.js";

export type { RoundMode } from "../decimal/index.js";

export function tickRound(price: Dec, market: Pick<Market, "tickSize">, mode: RoundMode): Dec {
  return decRoundToStep(price, market.tickSize, mode);
}
