import type { Dec } from "../contract/index.js";
import { decDiv, decIsZero, decToNumber } from "../decimal/index.js";

export interface RoeParams {
  uPnl: Dec;
  margin: Dec;
}

/** Return on equity as a percentage (lossy ratio — CORE_SPEC.md §3). */
export function roe(params: RoeParams): number {
  const { uPnl, margin } = params;
  if (decIsZero(margin)) return 0;
  return decToNumber(decDiv(uPnl, margin)) * 100;
}
