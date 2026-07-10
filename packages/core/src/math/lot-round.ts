import type { Dec, Market } from "../contract/index.js";
import { decRoundToStep, type RoundMode } from "../decimal/index.js";

export function lotRound(size: Dec, market: Pick<Market, "lotSize">, mode: RoundMode): Dec {
  return decRoundToStep(size, market.lotSize, mode);
}
