import type { Dec } from "../contract/index.js";
import { dec, decMul } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

export function formatFunding(rate: Dec, mode: "bp" | "percent", locale?: string): FormattedParts {
  const scaled = mode === "bp" ? decMul(rate, dec(10_000)) : decMul(rate, dec(100));
  const unit = mode === "bp" ? "bp" : "%";
  return splitParts(scaled, mode === "bp" ? 2 : 4, unit, "+", locale);
}
