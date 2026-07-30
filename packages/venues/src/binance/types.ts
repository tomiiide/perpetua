/** Raw Binance USDⓈ-M futures wire shapes. Nothing here ever leaves the venue boundary unmapped. */

export interface BnSymbolFilter {
  filterType: string;
  tickSize?: string;
  stepSize?: string;
  notional?: string;
}

export interface BnExchangeSymbol {
  symbol: string;
  status: string;
  contractType: string;
  baseAsset: string;
  quoteAsset: string;
  filters: BnSymbolFilter[];
}

export interface BnExchangeInfo {
  symbols: BnExchangeSymbol[];
}

/** [price, size] */
export type BnRawLevel = [string, string];

export interface BnDepthSnapshot {
  lastUpdateId: number;
  E: number;
  T: number;
  bids: BnRawLevel[];
  asks: BnRawLevel[];
}

export interface BnDepthUpdate {
  e: "depthUpdate";
  E: number;
  T: number;
  s: string;
  /** first update id in event */
  U: number;
  /** last update id in event */
  u: number;
  /** last update id of the previous event (continuity check) */
  pu: number;
  b: BnRawLevel[];
  a: BnRawLevel[];
}

export interface BnAggTrade {
  e: "aggTrade";
  E: number;
  s: string;
  /** aggregate trade id */
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  /** buyer is maker (i.e. the aggressor sold) */
  m: boolean;
}

export interface BnWsKlineData {
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
  /** candle closed */
  x: boolean;
  q: string;
}

export interface BnWsKline {
  e: "kline";
  E: number;
  s: string;
  k: BnWsKlineData;
}

/** [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBase, takerQuote, ignore] */
export type BnKlineRow = [number, string, string, string, string, string, number, string, number, string, string, string];

export interface BnMarkPriceUpdate {
  e: "markPriceUpdate";
  E: number;
  s: string;
  /** mark price */
  p: string;
  /** index price */
  i: string;
  /** estimated settle price */
  P: string;
  /** funding rate for the current interval */
  r: string;
  /** next funding time (ms; 0 when the symbol has no funding) */
  T: number;
}

export interface BnTicker24h {
  e: "24hrTicker";
  E: number;
  s: string;
  /** price change */
  p: string;
  /** price change percent */
  P: string;
  /** last price */
  c: string;
  o: string;
  h: string;
  l: string;
  /** base-asset volume */
  v: string;
  /** quote-asset (notional) volume */
  q: string;
}

export interface BnForceOrderData {
  s: string;
  S: "BUY" | "SELL";
  /** original quantity */
  q: string;
  p: string;
  /** average fill price */
  ap: string;
  /** accumulated filled quantity */
  z: string;
  T: number;
}

export interface BnForceOrder {
  e: "forceOrder";
  E: number;
  o: BnForceOrderData;
}

export interface BnOpenInterest {
  openInterest: string;
  symbol: string;
  time: number;
}

export interface BnFundingInfoEntry {
  symbol: string;
  fundingIntervalHours: number;
}
