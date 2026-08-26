/**
 * Placement gating and the soft-band scorers: dependency constraints must not
 * measure against locations that never placed, and the band math must hold at
 * its edges.
 */
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore plain-JS core module
import { CONSTRAINTS, SCORERS, softBandScore } from "./constraints.mjs";

describe("softBandScore", () => {
  it("hard-fails below min and is linear from min to ideal", () => {
    const band = { min: 750, ideal: 1500 };
    expect(softBandScore(749, band)).toBe(0);
    expect(softBandScore(750, band)).toBe(0);
    expect(softBandScore(1125, band)).toBeCloseTo(0.5, 6);
    expect(softBandScore(1500, band)).toBe(1);
    expect(softBandScore(99999, band)).toBe(1);
  });

  it("dual band plateaus between ideal and ideal_max", () => {
    const band = { min: 0, ideal: 300, ideal_max: 800, max: 1600 };
    expect(softBandScore(300, band)).toBe(1);
    expect(softBandScore(800, band)).toBe(1);
    expect(softBandScore(1200, band)).toBeCloseTo(0.5, 6);
    expect(softBandScore(1601, band)).toBe(0);
  });
});

describe("separation scorer", () => {
  it("treats Infinity (nothing nearby to be near) as the best case, not the worst", () => {
    expect(SCORERS.separation(Infinity, {})).toBe(1);
  });
  it("scores through the band when one is given", () => {
    expect(SCORERS.separation(1500, { band: { min: 750, ideal: 1500 } })).toBe(1);
    expect(SCORERS.separation(750, { band: { min: 750, ideal: 1500 } })).toBe(0);
  });
});

describe("dependency gating", () => {
  const baseCtx = {
    x: 0,
    z: 0,
    memo: new Map(),
    siteOf: (name: string) => (name === "Capital" ? [1000, 1000] : undefined),
  };

  it("reachability against an unplaced location is blocked, not measured", () => {
    const ctx = { ...baseCtx, refSite: () => undefined };
    const r = CONSTRAINTS.reachability(ctx, { location: "Capital" });
    expect(r.pass).toBe(false);
    expect(r.blocked).toBe(true);
  });

  it("distance_to against an unplaced location is blocked, not measured", () => {
    const ctx = { ...baseCtx, refSite: () => undefined };
    const r = CONSTRAINTS.distance_to(ctx, { location: "Capital", minimum: 750 });
    expect(r.pass).toBe(false);
    expect(r.blocked).toBe(true);
  });

  it("distance_to falls back to siteOf when no refSite is provided (legacy engines)", () => {
    const r = CONSTRAINTS.distance_to(baseCtx, { location: "Capital", minimum: 750 });
    expect(r.pass).toBe(true);
    expect(r.value).toBeCloseTo(Math.hypot(1000, 1000), 6);
  });
});
