/**
 * Internal only — instantiated by `watchOrderBook`, never imported directly
 * (CORE_SPEC.md §5.6). Behavioral contract lands in M1: buffer diffs before
 * snapshot, seq-gap resync, checksum/periodic-refresh fallback for
 * no-seq venues, grouping as a derived view, per-level flash tagging,
 * staleAfter timeout, frameBudget-coalesced emission.
 */
export class BookEngine {
  constructor() {
    throw new Error("not implemented: BookEngine (M1)");
  }
}
