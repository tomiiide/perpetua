/**
 * Venue conformance suite + deterministic mock venue (CORE_SPEC.md §9). Venue
 * packages run `runConformance` against their venue (fed recorded fixtures) as
 * the bar for a `@perpetua/venue-*` release; the mock is the reference that
 * proves the contract is implementable and the fixture backbone for the engine.
 */
export { runConformance } from "./run-conformance.js";
export type { ConformanceReport, ConformanceFailure } from "./run-conformance.js";
export { createMockVenue } from "./mock-venue.js";
export { createTestClock } from "./test-clock.js";
export type { TestClock } from "./test-clock.js";
export { createTestScheduler } from "./test-scheduler.js";
export type { TestScheduler } from "./test-scheduler.js";
