import Big from "big.js";
import type { Dec } from "../contract/dec.js";

/**
 * big.js-backed Dec (CORE_SPEC.md §12). Every price/size wire value is
 * parsed through `dec()` at the venue boundary and never touches a float;
 * `decToNumber` is the sole, explicitly-lossy escape hatch.
 */
interface DecBox {
  readonly __brand: "Dec";
  readonly value: Big;
}

function box(value: Big): Dec {
  return { __brand: "Dec", value } as unknown as Dec;
}

function unwrap(d: Dec): Big {
  return (d as unknown as DecBox).value;
}

export function dec(value: string | number | Dec): Dec {
  if (typeof value === "object") return value;
  return box(new Big(value));
}

export const ZERO: Dec = dec("0");
export const ONE: Dec = dec("1");

export function decAdd(a: Dec, b: Dec): Dec {
  return box(unwrap(a).plus(unwrap(b)));
}

export function decSub(a: Dec, b: Dec): Dec {
  return box(unwrap(a).minus(unwrap(b)));
}

export function decMul(a: Dec, b: Dec): Dec {
  return box(unwrap(a).times(unwrap(b)));
}

export function decDiv(a: Dec, b: Dec): Dec {
  return box(unwrap(a).div(unwrap(b)));
}

export function decNeg(a: Dec): Dec {
  return box(unwrap(a).times(-1));
}

export function decAbs(a: Dec): Dec {
  return box(unwrap(a).abs());
}

export function decCmp(a: Dec, b: Dec): -1 | 0 | 1 {
  return unwrap(a).cmp(unwrap(b)) as -1 | 0 | 1;
}

export function decEq(a: Dec, b: Dec): boolean {
  return unwrap(a).eq(unwrap(b));
}

export function decLt(a: Dec, b: Dec): boolean {
  return unwrap(a).lt(unwrap(b));
}

export function decLte(a: Dec, b: Dec): boolean {
  return unwrap(a).lte(unwrap(b));
}

export function decGt(a: Dec, b: Dec): boolean {
  return unwrap(a).gt(unwrap(b));
}

export function decGte(a: Dec, b: Dec): boolean {
  return unwrap(a).gte(unwrap(b));
}

export function decMin(a: Dec, b: Dec): Dec {
  return decLte(a, b) ? a : b;
}

export function decMax(a: Dec, b: Dec): Dec {
  return decGte(a, b) ? a : b;
}

export function decIsZero(a: Dec): boolean {
  return unwrap(a).eq(0);
}

export function decIsPositive(a: Dec): boolean {
  return unwrap(a).gt(0);
}

export function decIsNegative(a: Dec): boolean {
  return unwrap(a).lt(0);
}

export type RoundMode = "down" | "up" | "nearest";

const BIG_ROUND_MODE: Record<RoundMode, 0 | 1 | 3> = {
  down: Big.roundDown,
  nearest: Big.roundHalfUp,
  up: Big.roundUp,
};

/** Rounds `value` to the nearest multiple of `step` (e.g. tickSize/lotSize). */
export function decRoundToStep(value: Dec, step: Dec, mode: RoundMode): Dec {
  if (decIsZero(step)) return value;
  const steps = unwrap(value).div(unwrap(step)).round(0, BIG_ROUND_MODE[mode]);
  return box(steps.times(unwrap(step)));
}

/** Digits after the decimal point in `d`'s exact string form. Used to derive display precision from tickSize/lotSize. */
export function decDecimalPlaces(d: Dec): number {
  const s = unwrap(d).toString();
  const i = s.indexOf(".");
  return i === -1 ? 0 : s.length - i - 1;
}

/** Exact string, no rounding, never exponential notation. */
export function decToString(d: Dec): string {
  return unwrap(d).toString();
}

/** Fixed decimal places, half-up rounded. */
export function decToFixed(d: Dec, dp: number): string {
  return unwrap(d).toFixed(dp);
}

/** Explicitly lossy — for chart coordinates, ratios, and other float-tolerant contexts only (CORE_SPEC.md §3). */
export function decToNumber(d: Dec): number {
  return unwrap(d).toNumber();
}
