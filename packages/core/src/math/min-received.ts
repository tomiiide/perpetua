import { dec, decMul, decSub, decToString, ONE } from "../decimal/index.js";

/** Swap-side math for later verticals (SPEC.md §Layer 0 Math). */
export function minReceived(quotedOut: string, slippagePct: number): string {
  return decToString(decMul(dec(quotedOut), decSub(ONE, dec(slippagePct / 100))));
}
