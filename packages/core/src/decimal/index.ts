/**
 * Internal decimal engine (CORE_SPEC.md §12): scaled bigint.
 *
 * A value is a signed bigint mantissa `v` plus a decimal scale `s` (>= 0);
 * the real number is `v / 10^s`. add/sub/mul are exact; div is computed to
 * DIV_DP places (half-up, ties away from zero), matching the old big.js DP.
 * Mantissas are kept trailing-zero-free so `s` is the exact decimal-place count.
 *
 * Not exported from the package root: `Dec` never crosses the public boundary.
 * Prices/sizes enter as `string` (via `dec()`) and leave as `string` (via
 * `decToString`); no float ever touches a price or size. `decToNumber` is the
 * sole, explicitly-lossy escape hatch.
 */
export type Dec = { readonly __brand: "Dec" };

interface DecVal {
  readonly __brand: "Dec";
  readonly v: bigint; // signed mantissa
  readonly s: number; // scale: implied decimal places, >= 0
}

/** Number of decimal places division is carried to (matches big.js default DP). */
const DIV_DP = 20;

const POW10: bigint[] = [];
function pow10(n: number): bigint {
  const cached = POW10[n];
  if (cached !== undefined) return cached;
  const value = 10n ** BigInt(n);
  POW10[n] = value;
  return value;
}

function make(v: bigint, s: number): Dec {
  if (v === 0n) return { __brand: "Dec", v: 0n, s: 0 } as unknown as Dec;
  while (s > 0 && v % 10n === 0n) {
    v /= 10n;
    s--;
  }
  return { __brand: "Dec", v, s } as unknown as Dec;
}

function unwrap(d: Dec): DecVal {
  return d as unknown as DecVal;
}

function align(a: DecVal, b: DecVal): { av: bigint; bv: bigint } {
  if (a.s === b.s) return { av: a.v, bv: b.v };
  return a.s > b.s
    ? { av: a.v, bv: b.v * pow10(a.s - b.s) }
    : { av: a.v * pow10(b.s - a.s), bv: b.v };
}

/** |num| / |den| rounded to an integer, ties away from zero; sign of num/den applied. */
function divHalfUp(num: bigint, den: bigint): bigint {
  const neg = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = n / d;
  const r = n % d;
  const mag = r * 2n >= d ? q + 1n : q;
  return neg ? -mag : mag;
}

function parse(str: string): Dec {
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(str.trim());
  const digits = m ? (m[2] ?? "") + (m[3] ?? "") : "";
  if (!m || digits === "") throw new Error(`invalid decimal: ${str}`);
  const sign = m[1] === "-" ? -1n : 1n;
  const exp = m[4] ? parseInt(m[4], 10) : 0;
  let v = BigInt(digits) * sign;
  let s = (m[3]?.length ?? 0) - exp;
  if (s < 0) {
    v *= pow10(-s);
    s = 0;
  }
  return make(v, s);
}

export function dec(value: string | number | Dec): Dec {
  if (typeof value === "object") return value;
  return parse(String(value));
}

export const ZERO: Dec = dec("0");
export const ONE: Dec = dec("1");

export function decAdd(a: Dec, b: Dec): Dec {
  const x = unwrap(a);
  const y = unwrap(b);
  const { av, bv } = align(x, y);
  return make(av + bv, Math.max(x.s, y.s));
}

export function decSub(a: Dec, b: Dec): Dec {
  const x = unwrap(a);
  const y = unwrap(b);
  const { av, bv } = align(x, y);
  return make(av - bv, Math.max(x.s, y.s));
}

export function decMul(a: Dec, b: Dec): Dec {
  const x = unwrap(a);
  const y = unwrap(b);
  return make(x.v * y.v, x.s + y.s);
}

export function decDiv(a: Dec, b: Dec): Dec {
  const x = unwrap(a);
  const y = unwrap(b);
  const num = x.v * pow10(y.s + DIV_DP);
  const den = y.v * pow10(x.s);
  return make(divHalfUp(num, den), DIV_DP);
}

export function decNeg(a: Dec): Dec {
  const x = unwrap(a);
  return make(-x.v, x.s);
}

export function decCmp(a: Dec, b: Dec): -1 | 0 | 1 {
  const { av, bv } = align(unwrap(a), unwrap(b));
  return av < bv ? -1 : av > bv ? 1 : 0;
}

export function decGte(a: Dec, b: Dec): boolean {
  return decCmp(a, b) >= 0;
}

export function decIsZero(a: Dec): boolean {
  return unwrap(a).v === 0n;
}

export function decIsPositive(a: Dec): boolean {
  return unwrap(a).v > 0n;
}

export function decIsNegative(a: Dec): boolean {
  return unwrap(a).v < 0n;
}

export type RoundMode = "down" | "up" | "nearest";

/** |num| / |den| to an integer per `mode`; sign of num/den applied. */
function divMode(num: bigint, den: bigint, mode: RoundMode): bigint {
  const neg = num < 0n !== den < 0n;
  const n = num < 0n ? -num : num;
  const d = den < 0n ? -den : den;
  const q = n / d;
  const r = n % d;
  let mag = q;
  if (r !== 0n) {
    if (mode === "up") mag = q + 1n;
    else if (mode === "nearest") mag = r * 2n >= d ? q + 1n : q;
  }
  return neg ? -mag : mag;
}

/** Rounds `value` to the nearest multiple of `step` (e.g. tickSize/lotSize). */
export function decRoundToStep(value: Dec, step: Dec, mode: RoundMode): Dec {
  const v = unwrap(value);
  const st = unwrap(step);
  if (st.v === 0n) return value;
  const steps = divMode(v.v * pow10(st.s), st.v * pow10(v.s), mode);
  return make(steps * st.v, st.s);
}

/** Exact integer count of `step`s in `value` per `mode` — the multiplier decRoundToStep applies. For fast, allocation-free bucketing (book grouping). */
export function decStepCount(value: Dec, step: Dec, mode: RoundMode): bigint {
  const v = unwrap(value);
  const st = unwrap(step);
  if (st.v === 0n) return 0n;
  return divMode(v.v * pow10(st.s), st.v * pow10(v.s), mode);
}

/** Digits after the decimal point in `d`'s exact form. Used to derive display precision from tickSize/lotSize. */
export function decDecimalPlaces(d: Dec): number {
  return unwrap(d).s;
}

/** Exact string, no rounding, never exponential notation. */
export function decToString(d: Dec): string {
  const { v, s } = unwrap(d);
  const neg = v < 0n;
  let digits = (neg ? -v : v).toString();
  if (s === 0) return (neg ? "-" : "") + digits;
  if (digits.length <= s) digits = digits.padStart(s + 1, "0");
  const cut = digits.length - s;
  return `${neg ? "-" : ""}${digits.slice(0, cut)}.${digits.slice(cut)}`;
}

/** Fixed decimal places, half-up rounded (ties away from zero); never emits negative zero. */
export function decToFixed(d: Dec, dp: number): string {
  const { v, s } = unwrap(d);
  const scaled = dp >= s ? v * pow10(dp - s) : divHalfUp(v, pow10(s - dp));
  const neg = scaled < 0n;
  let digits = (neg ? -scaled : scaled).toString();
  if (dp === 0) return (neg ? "-" : "") + digits;
  if (digits.length <= dp) digits = digits.padStart(dp + 1, "0");
  const cut = digits.length - dp;
  return `${neg ? "-" : ""}${digits.slice(0, cut)}.${digits.slice(cut)}`;
}

/** Explicitly lossy — for chart coordinates, ratios, and other float-tolerant contexts only (CORE_SPEC.md §3). */
export function decToNumber(d: Dec): number {
  return Number(decToString(d));
}
