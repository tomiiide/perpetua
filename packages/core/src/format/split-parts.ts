import { dec, decToFixed } from "../decimal/index.js";
import type { FormattedParts } from "./types.js";

/** Shared by every formatter: fixes `v` to `dp` places, splits sign/int/frac, groups `int` per locale. */
export function splitParts(
  v: string,
  dp: number,
  unit: string,
  forceSign: "" | "+",
  locale = "en-US",
): FormattedParts {
  const fixed = decToFixed(dec(v), dp);
  const negative = fixed.startsWith("-");
  const unsigned = negative ? fixed.slice(1) : fixed;
  const [intRaw, frac = ""] = unsigned.split(".");
  const int = new Intl.NumberFormat(locale, { useGrouping: true }).format(BigInt(intRaw || "0"));
  const sign: FormattedParts["sign"] = negative ? "-" : forceSign;
  const text = `${sign}${int}${frac ? `.${frac}` : ""}${unit ? ` ${unit}` : ""}`;
  return { sign, int, frac, unit, text };
}
