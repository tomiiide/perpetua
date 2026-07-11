import type { Capabilities, Resolution } from "@perpetua/core";

/** HL's `3d` candle interval has no home in the canonical `Resolution` union, so it's dropped. */
export const HL_CANDLE_RESOLUTIONS: Resolution[] = [
  "1m", "3m", "5m", "15m", "30m",
  "1h", "2h", "4h", "8h", "12h",
  "1d", "1w", "1M",
];

export function hyperliquidCapabilities(): Capabilities {
  return {
    matching: "continuous",
    bookFeed: "pushSnapshot",
    sequenceNumbers: false,
    publicTape: true,
    candleResolutions: HL_CANDLE_RESOLUTIONS,
    nativeTriggers: true,
    nativeTwap: true,
    orderIdentity: "clientId",
    batchOrders: true,
    // FOK isn't a documented HL tif; only GTC, IOC and ALO (post-only) are supported.
    tifs: ["GTC", "IOC", "ALO"],
    marketTypes: ["perp"],
    // This venue instance ships with no `account` factory (market-data-only scope), so it's
    // honestly read-only as constructed — never claim `'wallet'` for a capability not implemented.
    credential: null,
  };
}
