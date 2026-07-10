import type { Dec, PositionSide } from "../contract/index.js";
import {
  decAdd,
  decDiv,
  decIsPositive,
  decIsZero,
  decMul,
  decSub,
  ONE,
} from "../decimal/index.js";

export interface LiqPriceParams {
  side: PositionSide;
  entryPrice: Dec;
  size: Dec;
  margin: Dec;
  maintenanceMarginRate: Dec;
}

/**
 * Isolated-margin liquidation price: solves `equity(P) = maintenanceMargin(P)`
 * for P, where equity is margin + unrealized PnL and maintenance margin
 * scales with current notional. Ignores funding/fees (venue-specific;
 * exact parity is a venue concern, not core's).
 */
export function liqPrice(params: LiqPriceParams): Dec | null {
  const { side, entryPrice, size, margin, maintenanceMarginRate } = params;
  if (decIsZero(size)) return null;

  const notional = decMul(entryPrice, size);
  let price: Dec;
  if (side === "long") {
    // P = (entry*size - margin) / (size*(1 - mmr))
    const denom = decMul(size, decSub(ONE, maintenanceMarginRate));
    if (!decIsPositive(denom)) return null; // mmr >= 100%, position can't be margined
    price = decDiv(decSub(notional, margin), denom);
  } else {
    // P = (margin + entry*size) / (size*(1 + mmr))
    const denom = decMul(size, decAdd(ONE, maintenanceMarginRate));
    price = decDiv(decAdd(margin, notional), denom);
  }

  return decIsPositive(price) ? price : null;
}
