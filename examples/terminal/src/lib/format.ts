import { dec, decMul, decToString } from "@perpetua/core";

/** Grouping steps offered in the order book: tick × {1, 10, 100, 1000}. */
export function groupingPresets(tickSize: string): string[] {
  const base = dec(tickSize);
  return [1, 10, 100, 1000].map((m) => decToString(decMul(base, dec(m))));
}

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false });
}

/** FlashCell compare: prev - next, so a price increase flashes "up". */
export function numericCompare(prev: unknown, next: unknown): number {
  return Number(prev) - Number(next);
}
