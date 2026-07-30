import { dec, decToString, type EventSink, type Funding, type MarketId, type Unsubscribe } from "@perpetua/core";
import { streamName, symbolFromMarketId } from "./mapping.js";
import type { RestClient } from "./rest-client.js";
import type { BnFundingInfoEntry, BnMarkPriceUpdate } from "./types.js";
import type { BinanceWsClient } from "./ws-client.js";

const HOUR_US = 3_600_000 * 1000;
const DEFAULT_FUNDING_INTERVAL_HOURS = 8;

/**
 * `rate`/`nextAt` stream live off `markPrice@1s`; the interval is backfilled
 * from one `fundingInfo` REST call, which lists only symbols deviating from
 * the 8h default. Binance exposes a single live rate for the current interval,
 * so `predicted` stays null rather than duplicating `rate`.
 */
export function subscribeFunding(
  ws: BinanceWsClient,
  rest: RestClient,
  marketId: MarketId,
  sink: EventSink,
): Unsubscribe {
  const symbol = symbolFromMarketId(marketId);
  let intervalUs = DEFAULT_FUNDING_INTERVAL_HOURS * HOUR_US;

  rest
    .get<BnFundingInfoEntry[]>("/fapi/v1/fundingInfo")
    .then((rows) => {
      const entry = rows.find((r) => r.symbol === symbol);
      if (entry) intervalUs = entry.fundingIntervalHours * HOUR_US;
    })
    .catch(() => {
      // transient failure: keep the 8h default
    });

  return ws.subscribe(streamName(symbol, "markPrice@1s"), (data) => {
    const ev = data as BnMarkPriceUpdate;
    const funding: Funding = {
      rate: decToString(dec(ev.r)),
      predicted: null,
      nextAt: ev.T > 0 ? ev.T : null,
      indexCum: null,
      intervalUs,
      ts: ev.E,
    };
    sink({ kind: "funding", funding });
  });
}
