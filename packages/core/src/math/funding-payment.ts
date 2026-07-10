import type { Dec, PositionSide } from "../contract/index.js";
import { decMul, decNeg } from "../decimal/index.js";

export interface FundingPaymentParams {
  side: PositionSide;
  notional: Dec;
  /** normalized sign: positive = longs pay shorts. */
  rate: Dec;
}

/** Signed from the position holder's perspective: positive = they pay, negative = they receive. */
export function fundingPayment(params: FundingPaymentParams): Dec {
  const { side, notional, rate } = params;
  const payment = decMul(rate, notional);
  return side === "long" ? payment : decNeg(payment);
}
