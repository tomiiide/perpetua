import type { Dec, Side } from "../contract/index.js";
import { dec, decAdd, decMul, decSub } from "../decimal/index.js";

export interface SlippageBoundsParams {
  side: Side;
  referencePrice: Dec;
  slippagePct: number;
}

/** Acceptable price band for an order: worst case away from `referencePrice` by `slippagePct`. */
export function slippageBounds(params: SlippageBoundsParams): { min: Dec; max: Dec } {
  const { side, referencePrice, slippagePct } = params;
  const factor = decMul(referencePrice, dec(slippagePct / 100));
  return side === "buy"
    ? { min: referencePrice, max: decAdd(referencePrice, factor) }
    : { min: decSub(referencePrice, factor), max: referencePrice };
}
