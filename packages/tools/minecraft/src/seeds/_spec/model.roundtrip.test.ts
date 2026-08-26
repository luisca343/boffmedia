/**
 * The regression that motivated this test: the editor round-trip used to strip
 * the placement-engine flags, the hard-location weights and every score-term
 * band — and to inject vocabulary defaults the spec never asked for (a hard
 * flatness maximum onto the capitals, a surface ceiling onto Iwa). The product
 * then searched with a spec that was never benchmarked.
 *
 * A preset must survive `fromCoreSpec` → `toCoreSpec` byte-for-byte in every
 * part the engine reads.
 */
import { describe, expect, it } from "vitest";

import { fromCoreSpec, toCoreSpec } from "./model";
import { TERAS_SPEC } from "./teras";

describe("editor round-trip", () => {
  const round = toCoreSpec(fromCoreSpec(TERAS_SPEC as Record<string, unknown>), ["vanilla", "terralith"]);

  it("keeps the placement-engine flags", () => {
    expect(round.scan).toEqual(TERAS_SPEC.scan);
  });

  it("keeps the origin", () => {
    expect(round.origin).toEqual(TERAS_SPEC.origin);
  });

  it("keeps every location exactly — weights, constraints, score terms", () => {
    const locations = TERAS_SPEC.locations as Record<string, unknown>;
    expect(Object.keys(round.locations)).toEqual(Object.keys(locations));
    for (const name of Object.keys(locations)) {
      expect(round.locations[name], name).toEqual(locations[name]);
    }
  });
});
