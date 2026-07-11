import type { PositionSide } from "../contract/index.js";
import { dec, decMul, decNeg, decToString } from "../decimal/index.js";

export interface FundingPaymentParams {
  side: PositionSide;
  notional: string;
  /** normalized sign: positive = longs pay shorts. */
  rate: string;
}

/** Signed from the position holder's perspective: positive = they pay, negative = they receive. */
export function fundingPayment(params: FundingPaymentParams): string {
  const { side } = params;
  const payment = decMul(dec(params.rate), dec(params.notional));
  return decToString(side === "long" ? payment : decNeg(payment));
}
