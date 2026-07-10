import type { Dec } from "../contract/index.js";
import { dec, decAdd, decDiv, decMul, decSub, ONE } from "../decimal/index.js";

/** Swap-side math for later verticals (SPEC.md §Layer 0 Math). Constant-product (x*y=k) quote. */
export interface AmmQuoteParams {
  reserveIn: Dec;
  reserveOut: Dec;
  amountIn: Dec;
  feePct: number;
}

export function ammQuote(params: AmmQuoteParams): Dec {
  const { reserveIn, reserveOut, amountIn, feePct } = params;
  const amountInAfterFee = decMul(amountIn, decSub(ONE, dec(feePct / 100)));
  return decDiv(decMul(reserveOut, amountInAfterFee), decAdd(reserveIn, amountInAfterFee));
}
