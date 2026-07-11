import { dec, decAdd, decDiv, decMul, decSub, decToString, ONE } from "../decimal/index.js";

/** Swap-side math for later verticals (SPEC.md §Layer 0 Math). Constant-product (x*y=k) quote. */
export interface AmmQuoteParams {
  reserveIn: string;
  reserveOut: string;
  amountIn: string;
  feePct: number;
}

export function ammQuote(params: AmmQuoteParams): string {
  const reserveIn = dec(params.reserveIn);
  const reserveOut = dec(params.reserveOut);
  const amountIn = dec(params.amountIn);
  const amountInAfterFee = decMul(amountIn, decSub(ONE, dec(params.feePct / 100)));
  return decToString(decDiv(decMul(reserveOut, amountInAfterFee), decAdd(reserveIn, amountInAfterFee)));
}
