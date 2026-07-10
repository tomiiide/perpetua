/**
 * Internal only — instantiated by `watchCandles` (M2). Merges REST backfill
 * with the live partial candle at the seam with no gap and no double-count;
 * reuses cache across interval switches where derivable (CORE_SPEC.md §5.6).
 */
export class CandleStitcher {
  constructor() {
    throw new Error("not implemented: CandleStitcher (M2)");
  }
}
