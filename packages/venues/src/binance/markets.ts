import type { Market } from "@perpetua/core";
import { mapMarket } from "./mapping.js";
import type { RestClient } from "./rest-client.js";
import type { BnExchangeInfo } from "./types.js";

export async function fetchMarkets(rest: RestClient): Promise<Market[]> {
  const info = await rest.get<BnExchangeInfo>("/fapi/v1/exchangeInfo");
  const markets: Market[] = [];
  for (const sym of info.symbols) {
    if (sym.contractType !== "PERPETUAL" || sym.status !== "TRADING") continue;
    const market = mapMarket(sym);
    if (market) markets.push(market);
  }
  return markets;
}
