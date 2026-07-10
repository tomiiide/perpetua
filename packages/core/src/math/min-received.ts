import type { Dec } from "../contract/index.js";
import { dec, decMul, decSub, ONE } from "../decimal/index.js";

/** Swap-side math for later verticals (SPEC.md §Layer 0 Math). */
export function minReceived(quotedOut: Dec, slippagePct: number): Dec {
  return decMul(quotedOut, decSub(ONE, dec(slippagePct / 100)));
}
