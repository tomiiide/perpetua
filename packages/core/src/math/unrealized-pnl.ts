import type { Dec, PositionSide } from "../contract/index.js";
import { decMul, decSub } from "../decimal/index.js";

export interface UnrealizedPnlParams {
  side: PositionSide;
  entryPrice: Dec;
  markPrice: Dec;
  size: Dec;
}

export function unrealizedPnl(params: UnrealizedPnlParams): Dec {
  const { side, entryPrice, markPrice, size } = params;
  const diff = side === "long" ? decSub(markPrice, entryPrice) : decSub(entryPrice, markPrice);
  return decMul(diff, size);
}
