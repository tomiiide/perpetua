import { dec, decMul, decToString } from "../decimal/index.js";
import { splitParts } from "./split-parts.js";
import type { FormattedParts } from "./types.js";

export function formatFunding(rate: string, mode: "bp" | "percent", locale?: string): FormattedParts {
  const scaled = mode === "bp" ? decMul(dec(rate), dec(10_000)) : decMul(dec(rate), dec(100));
  const unit = mode === "bp" ? "bp" : "%";
  return splitParts(decToString(scaled), mode === "bp" ? 2 : 4, unit, "+", locale);
}
