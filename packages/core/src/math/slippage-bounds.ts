import type { Side } from "../contract/index.js";
import { dec, decAdd, decMul, decSub, decToString } from "../decimal/index.js";

export interface SlippageBoundsParams {
  side: Side;
  referencePrice: string;
  slippagePct: number;
}

/** Acceptable price band for an order: worst case away from `referencePrice` by `slippagePct`. */
export function slippageBounds(params: SlippageBoundsParams): { min: string; max: string } {
  const { side, slippagePct } = params;
  const referencePrice = dec(params.referencePrice);
  const factor = decMul(referencePrice, dec(slippagePct / 100));
  const ref = decToString(referencePrice);
  return side === "buy"
    ? { min: ref, max: decToString(decAdd(referencePrice, factor)) }
    : { min: decToString(decSub(referencePrice, factor)), max: ref };
}
