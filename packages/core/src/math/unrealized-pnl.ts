import type { PositionSide } from "../contract/index.js";
import { dec, decMul, decSub, decToString } from "../decimal/index.js";

export interface UnrealizedPnlParams {
  side: PositionSide;
  entryPrice: string;
  markPrice: string;
  size: string;
}

export function unrealizedPnl(params: UnrealizedPnlParams): string {
  const { side } = params;
  const entryPrice = dec(params.entryPrice);
  const markPrice = dec(params.markPrice);
  const size = dec(params.size);
  const diff = side === "long" ? decSub(markPrice, entryPrice) : decSub(entryPrice, markPrice);
  return decToString(decMul(diff, size));
}
