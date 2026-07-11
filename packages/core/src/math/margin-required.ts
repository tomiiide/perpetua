import { dec, decDiv, decToString } from "../decimal/index.js";

export interface MarginRequiredParams {
  notional: string;
  leverage: number;
}

export function marginRequired(params: MarginRequiredParams): string {
  return decToString(decDiv(dec(params.notional), dec(params.leverage)));
}
