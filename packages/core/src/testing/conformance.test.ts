import { describe, expect, it } from "vitest";
import { createMockVenue } from "./mock-venue.js";
import { createTestClock } from "./test-clock.js";
import { runConformance } from "./run-conformance.js";

describe("M0: conformance green on mock venue", () => {
  it("the mock venue passes every Tier A invariant", async () => {
    const report = await runConformance(createMockVenue());
    expect(report.failures).toEqual([]);
    expect(report.passed).toBe(true);
    expect(report.checks).toBeGreaterThan(0);
  });

  it("is deterministic across runs (same fixture → identical result)", async () => {
    const a = await runConformance(createMockVenue(createTestClock()));
    const b = await runConformance(createMockVenue(createTestClock()));
    expect(a.checks).toBe(b.checks);
    expect(a.failures).toEqual(b.failures);
  });

  it("catches a non-conformant venue (float where a decimal string is required)", async () => {
    const good = createMockVenue();
    const broken = {
      ...good,
      markets: async () => (await good.markets()).map((m) => ({ ...m, tickSize: 0.5 as unknown as string })),
    };
    const report = await runConformance(broken);
    expect(report.passed).toBe(false);
    expect(report.failures.some((f) => f.check === "market.tickSize.pos")).toBe(true);
  });
});
