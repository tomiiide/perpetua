import type { Dec } from "../contract/index.js";
import { dec, decDiv } from "../decimal/index.js";

export interface MarginRequiredParams {
  notional: Dec;
  leverage: number;
}

export function marginRequired(params: MarginRequiredParams): Dec {
  const { notional, leverage } = params;
  return decDiv(notional, dec(leverage));
}
