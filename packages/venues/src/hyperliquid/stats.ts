import {
  dec,
  decMax,
  decMin,
  type Dec,
  type EventSink,
  type MarketId,
  type MarketStats,
  type Unsubscribe,
} from "@perpetua/core";
import type { InfoClient } from "./info-client.js";
import { change24hPct, coinFromMarketId } from "./mapping.js";
import type { HlActiveAssetCtx, HlCandle } from "./types.js";
import type { HlWsClient } from "./ws-client.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_LOW_POLL_MS = 60_000;

interface HighLow24h {
  high: Dec | null;
  low: Dec | null;
}

/** HL's `activeAssetCtx` has no high/low24h fields, so they're derived from the last 24 hourly candles. */
async function fetchHighLow24h(info: InfoClient, coin: string): Promise<HighLow24h> {
  const now = Date.now();
  const candles = await info.post<HlCandle[]>({
    type: "candleSnapshot",
    req: { coin, interval: "1h", startTime: now - DAY_MS, endTime: now },
  });
  if (candles.length === 0) return { high: null, low: null };
  let high = dec(candles[0]!.h);
  let low = dec(candles[0]!.l);
  for (const candle of candles) {
    high = decMax(high, dec(candle.h));
    low = decMin(low, dec(candle.l));
  }
  return { high, low };
}

export function subscribeStats(
  ws: HlWsClient,
  info: InfoClient,
  marketId: MarketId,
  sink: EventSink,
): Unsubscribe {
  const coin = coinFromMarketId(marketId);
  let highLow: HighLow24h = { high: null, low: null };

  const refreshHighLow = (): void => {
    fetchHighLow24h(info, coin)
      .then((result) => {
        highLow = result;
      })
      .catch(() => {
        // transient failure: keep the last known high/low
      });
  };
  refreshHighLow();
  const pollTimer = setInterval(refreshHighLow, HIGH_LOW_POLL_MS);

  const unsubscribeWs = ws.subscribe({ type: "activeAssetCtx", coin }, (data) => {
    const { ctx } = data as HlActiveAssetCtx;
    const ts = Date.now();
    const lastPrice = dec(ctx.markPx);
    const stats: MarketStats = {
      vol24h: dec(ctx.dayNtlVlm),
      high24h: highLow.high ?? lastPrice,
      low24h: highLow.low ?? lastPrice,
      change24hPct: change24hPct(ctx),
      openInterest: dec(ctx.openInterest),
      lastPrice,
      ts,
    };
    sink({ kind: "stats", stats });
  });

  return () => {
    clearInterval(pollTimer);
    unsubscribeWs();
  };
}
