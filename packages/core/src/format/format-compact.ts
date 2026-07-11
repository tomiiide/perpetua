import { dec, decIsNegative, decToNumber } from "../decimal/index.js";
import type { FormattedParts } from "./types.js";

/** e.g. 1.2M, 340K. Explicitly lossy (CORE_SPEC.md §3) — for compact display only. */
export function formatCompact(v: string, locale = "en-US"): FormattedParts {
  const d = dec(v);
  const text = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(decToNumber(d));
  const negative = decIsNegative(d);
  const unsigned = negative ? text.replace("-", "") : text;
  const match = /^([\d.,]+)(\D*)$/.exec(unsigned);
  const int = match?.[1] ?? unsigned;
  const unit = match?.[2]?.trim() ?? "";
  return { sign: negative ? "-" : "", int, frac: "", unit, text };
}
