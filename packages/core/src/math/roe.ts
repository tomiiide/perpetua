import { dec, decDiv, decIsZero, decToNumber } from "../decimal/index.js";

export interface RoeParams {
  uPnl: string;
  margin: string;
}

/** Return on equity as a percentage (lossy ratio — CORE_SPEC.md §3). */
export function roe(params: RoeParams): number {
  const margin = dec(params.margin);
  if (decIsZero(margin)) return 0;
  return decToNumber(decDiv(dec(params.uPnl), margin)) * 100;
}
