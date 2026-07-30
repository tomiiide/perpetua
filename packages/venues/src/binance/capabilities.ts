import type { Capabilities, Resolution } from "@perpkit/core";

/** Binance's extra `6h`/`3d` intervals have no home in the canonical `Resolution` union, so they're dropped. */
export const BN_CANDLE_RESOLUTIONS: Resolution[] = [
  "1m", "3m", "5m", "15m", "30m",
  "1h", "2h", "4h", "8h", "12h",
  "1d", "1w", "1M",
];

export function binanceCapabilities(): Capabilities {
  return {
    matching: "continuous",
    bookFeed: "diff",
    sequenceNumbers: true,
    publicTape: true,
    candleResolutions: BN_CANDLE_RESOLUTIONS,
    nativeTriggers: true,
    nativeTwap: false,
    orderIdentity: "clientId",
    batchOrders: true,
    // Binance tifs GTX (post-only) and GTD map to canonical ALO and GTT.
    tifs: ["GTC", "IOC", "FOK", "ALO", "GTT"],
    marketTypes: ["perp"],
    // This venue instance ships with no `account` factory (market-data-only scope), so it's
    // honestly read-only as constructed — never claim `'apiKey'` for a capability not implemented.
    credential: null,
  };
}
