/** Raw Hyperliquid wire shapes. Nothing here ever leaves the venue boundary unmapped. */

export interface HlUniverseAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}

export interface HlMeta {
  universe: HlUniverseAsset[];
}

export interface HlAssetCtx {
  dayNtlVlm: string;
  funding: string;
  impactPxs?: [string, string] | null;
  markPx: string;
  midPx: string | null;
  openInterest: string;
  oraclePx: string;
  premium: string | null;
  prevDayPx: string;
}

export type HlMetaAndAssetCtxs = [HlMeta, HlAssetCtx[]];

export interface HlBookLevel {
  px: string;
  sz: string;
  n: number;
}

export interface HlL2Book {
  coin: string;
  time: number;
  levels: [HlBookLevel[], HlBookLevel[]];
}

export interface HlCandle {
  t: number;
  T: number;
  s: string;
  i: string;
  o: string;
  c: string;
  h: string;
  l: string;
  v: string;
  n: number;
}

export interface HlWsTrade {
  coin: string;
  side: "B" | "A";
  px: string;
  sz: string;
  hash: string;
  time: number;
  tid: number;
  users: [string, string];
}

export interface HlActiveAssetCtx {
  coin: string;
  ctx: HlAssetCtx;
}

export interface HlPredictedFundingVenueData {
  fundingRate: string;
  nextFundingTime: number;
  fundingIntervalHours: number;
}

export type HlPredictedFundingVenueEntry = [string, HlPredictedFundingVenueData | null];
export type HlPredictedFundingEntry = [string, HlPredictedFundingVenueEntry[]];
export type HlPredictedFundings = HlPredictedFundingEntry[];

export interface HlWsEnvelope<T = unknown> {
  channel: string;
  data: T;
}
