/**
 * Fixture recorder/replayer + conformance suite (CORE_SPEC.md §9). Venue
 * packages import this in their own test suites — passing conformance is
 * the bar for a `@perpetua/venue-*` release. Populated alongside the mock
 * venue in M0/M1.
 */
export function notImplemented(fn: string): never {
  throw new Error(`not implemented: ${fn} (M0 — mock venue + conformance suite)`);
}
