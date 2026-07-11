import type { PositionSide } from "../contract/index.js";
import {
  dec,
  decAdd,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  decToString,
  ONE,
  type Dec,
} from "../decimal/index.js";

export interface LiqPriceParams {
  side: PositionSide;
  entryPrice: string;
  size: string;
  margin: string;
  maintenanceMarginRate: string;
}

/**
 * Isolated-margin liquidation price: solves `equity(P) = maintenanceMargin(P)`
 * for P, where equity is margin + unrealized PnL and maintenance margin
 * scales with current notional. Ignores funding/fees (venue-specific;
 * exact parity is a venue concern, not core's).
 */
export function liqPrice(params: LiqPriceParams): string | null {
  const { side } = params;
  const size = dec(params.size);
  if (decIsZero(size)) return null;

  const entryPrice = dec(params.entryPrice);
  const margin = dec(params.margin);
  const mmr = dec(params.maintenanceMarginRate);

  const notional = decMul(entryPrice, size);
  let price: Dec;
  if (side === "long") {
    // P = (entry*size - margin) / (size*(1 - mmr))
    const denom = decMul(size, decSub(ONE, mmr));
    if (!decIsPositive(denom)) return null; // mmr >= 100%, position can't be margined
    price = decDiv(decSub(notional, margin), denom);
  } else {
    // P = (margin + entry*size) / (size*(1 + mmr))
    const denom = decMul(size, decAdd(ONE, mmr));
    price = decDiv(decAdd(margin, notional), denom);
  }

  return decIsPositive(price) ? decToString(price) : null;
}
