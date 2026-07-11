import { dec, type Dec, type EventSink, type Funding, type MarketId, type Unsubscribe } from "@perpetua/core";
import type { InfoClient } from "./info-client.js";
import { coinFromMarketId } from "./mapping.js";
import type { HlActiveAssetCtx, HlPredictedFundings } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

const HOUR_MS = 3_600_000;
/** HL funds hourly (docs: "Hyperliquid funds hourly"). */
const HL_FUNDING_INTERVAL_US = HOUR_MS * 1000;
const PREDICTED_FUNDING_POLL_MS = 30_000;
const HL_PREDICTED_FUNDING_VENUE = "HlPerp";

function nextFundingBoundary(ts: number): number {
  return Math.ceil(ts / HOUR_MS) * HOUR_MS;
}

interface PredictedFunding {
  rate: Dec | null;
  nextAt: number | null;
}

async function fetchPredictedFunding(info: InfoClient, coin: string): Promise<PredictedFunding> {
  const rows = await info.post<HlPredictedFundings>({ type: "predictedFundings" });
  const entry = rows.find(([c]) => c === coin);
  const venueEntry = entry?.[1].find(([venueName]) => venueName === HL_PREDICTED_FUNDING_VENUE);
  const venueData = venueEntry?.[1];
  if (!venueData) return { rate: null, nextAt: null };
  return { rate: dec(venueData.fundingRate), nextAt: venueData.nextFundingTime };
}

/**
 * `rate` streams live off the `activeAssetCtx` ws channel; `predicted` and
 * `nextAt` are backfilled from a lightly-polled `predictedFundings` REST
 * call (HL doesn't push predicted funding over the socket).
 */
export function subscribeFunding(
  ws: HlWsClient,
  info: InfoClient,
  marketId: MarketId,
  sink: EventSink,
): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  let predicted: PredictedFunding = { rate: null, nextAt: null };

  const refreshPredicted = (): void => {
    fetchPredictedFunding(info, coin)
      .then((result) => {
        predicted = result;
      })
      .catch(() => {
        // transient failure: keep the last known predicted funding
      });
  };
  refreshPredicted();
  const pollTimer = setInterval(refreshPredicted, PREDICTED_FUNDING_POLL_MS);

  const unsubscribeWs = ws.subscribe({ type: "activeAssetCtx", coin }, (data) => {
    const { ctx } = data as HlActiveAssetCtx;
    const ts = Date.now();
    const funding: Funding = {
      rate: dec(ctx.funding),
      predicted: predicted.rate,
      nextAt: predicted.nextAt ?? nextFundingBoundary(ts),
      indexCum: null,
      intervalUs: HL_FUNDING_INTERVAL_US,
      ts,
    };
    sink({ kind: "funding", funding });
  });

  return () => {
    clearInterval(pollTimer);
    unsubscribeWs();
  };
}
