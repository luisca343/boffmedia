/**
 * Tests for seedSpecShare — round-trip, version mismatch, corrupted input.
 *
 * The round-trip test is critical: we encode a spec, then decode it, then
 * serialize to core format to verify it matches the same path the product uses.
 * A preset that survives encode→decode but diverges in the core format is
 * worse than useless — it is a wrong audit that looks like a right one.
 */

import { describe, expect, it } from "vitest";
import * as pakoModule from "pako";
import { decodeSpec, encodeSpec, SpecShareError } from "./seedSpecShare";
import { fromCoreSpec, toCoreSpec, type UiSpec } from "../_spec/model";

// Handle both ESM and CommonJS imports of pako
const pako = (pakoModule as { default?: typeof pakoModule } & typeof pakoModule).default || pakoModule;

/**
 * A minimal but complete UiSpec for testing.
 */
const testSpec: UiSpec = {
  origin: { x: 100, z: 200 },
  scan: {
    radius: 12096,
    coarseStep: 192,
    fineStep: 16,
    water: "auto",
    prefilter: {
      enabled: true,
      radius: 1200,
      step: 64,
      water: "biome",
    },
    engine: {},
  },
  locations: [
    {
      id: "loc-1",
      name: "Spawn",
      hard: true,
      weight: 1,
      theme: "normal",
      mode: "at",
      at: { x: 100, z: 200, tolerance: 800 },
      discover: {
        direction: "north",
        min: 2000,
        max: 5000,
        step: 500,
        xRange: null,
      },
      constraints: [],
      score: [],
    },
  ],
};

describe("seedSpecShare", () => {
  describe("encodeSpec", () => {
    it("produces a non-empty base64url string", () => {
      const encoded = encodeSpec(testSpec);
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe("string");
      // Should not contain base64 padding or special chars
      expect(/^[A-Za-z0-9_-]+$/.test(encoded)).toBe(true);
    });

    it("handles specs with empty locations", () => {
      const spec: UiSpec = { ...testSpec, locations: [] };
      const encoded = encodeSpec(spec);
      expect(encoded).toBeTruthy();
    });

    it("handles complex constraints and score terms", () => {
      const spec: UiSpec = {
        ...testSpec,
        locations: [
          {
            ...testSpec.locations[0],
            constraints: [
              {
                id: "c-1",
                type: "biome",
                values: { biomes: ["minecraft:plains", "minecraft:forest"] },
              },
              {
                id: "c-2",
                type: "flatness",
                values: { maximum: 2.5 },
              },
            ],
            score: [
              { type: "flatness", weight: 1, extra: { bands: [[0, 1], [2, 3]] } },
              { type: "temperature", weight: 0.5, reference: 1 },
            ],
          },
        ],
      };
      const encoded = encodeSpec(spec);
      expect(encoded).toBeTruthy();
    });

    it("throws SpecShareError on encoding error (e.g., circular references)", () => {
      const badSpec = { origin: { x: 0, z: 0 } };
      (badSpec as Record<string, unknown>).self = badSpec; // Create circular ref
      expect(() => encodeSpec(badSpec as UiSpec)).toThrow(SpecShareError);
    });
  });

  describe("decodeSpec", () => {
    it("round-trips a spec identically", () => {
      const encoded = encodeSpec(testSpec);
      const decoded = decodeSpec(encoded);
      expect(decoded).toEqual(testSpec);
    });

    it("round-trips through core format (the product path)", () => {
      const encoded = encodeSpec(testSpec);
      const decoded = decodeSpec(encoded);
      // The real test: serialize to core, back to UI, back to core — must match
      const core1 = toCoreSpec(testSpec, ["vanilla"]);
      const ui = fromCoreSpec(core1 as unknown as Record<string, unknown>);
      const decoded2 = decodeSpec(encodeSpec(ui));
      const core2 = toCoreSpec(decoded2, ["vanilla"]);
      expect(core2).toEqual(core1);
    });

    it("preserves engine flags through round-trip", () => {
      const spec: UiSpec = {
        ...testSpec,
        scan: {
          ...testSpec.scan,
          engine: {
            resolution_order: "breadth_first",
            fine_top_k: 100,
            score_gating: true,
          },
        },
      };
      const encoded = encodeSpec(spec);
      const decoded = decodeSpec(encoded);
      expect(decoded.scan.engine).toEqual(spec.scan.engine);
    });

    it("preserves location weights through round-trip", () => {
      const spec: UiSpec = {
        ...testSpec,
        locations: [
          {
            ...testSpec.locations[0],
            hard: false,
            weight: 2.5,
          },
        ],
      };
      const encoded = encodeSpec(spec);
      const decoded = decodeSpec(encoded);
      expect(decoded.locations[0].weight).toBe(2.5);
    });

    it("rejects empty input", () => {
      expect(() => decodeSpec("")).toThrow(SpecShareError);
      expect(() => decodeSpec(null as unknown as string)).toThrow(SpecShareError);
    });

    it("rejects invalid base64url", () => {
      expect(() => decodeSpec("!!!")).toThrow(SpecShareError);
      expect(() => decodeSpec("not a valid base64")).toThrow(SpecShareError);
    });

    it("rejects version mismatch with clear error", () => {
      // Create a manually constructed spec with invalid version
      const testJson = JSON.stringify(testSpec);
      const testBytes = new TextEncoder().encode(testJson);
      const compressed = new Uint8Array(testBytes); // Skip actual compression for this test

      // Prepend an invalid version byte
      const withVersion = new Uint8Array(1 + compressed.length);
      withVersion[0] = 99; // Invalid version
      withVersion.set(compressed, 1);

      // Convert to base64url
      const base64 = Buffer.from(withVersion).toString("base64");
      const encoded = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      try {
        decodeSpec(encoded);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SpecShareError);
        expect(String(err)).toContain("unsupported format version");
      }
    });

    it("rejects truncated data with clear error", () => {
      const encoded = encodeSpec(testSpec);
      // Remove last few characters to truncate
      const truncated = encoded.slice(0, -5);
      try {
        decodeSpec(truncated);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SpecShareError);
        expect(String(err)).toContain("corrupted");
      }
    });

    it("rejects corrupted data with clear error", () => {
      const encoded = encodeSpec(testSpec);
      // Flip middle bits
      const chars = encoded.split("");
      chars[Math.floor(chars.length / 2)] = chars[Math.floor(chars.length / 2)] === "A" ? "B" : "A";
      const corrupted = chars.join("");

      try {
        decodeSpec(corrupted);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SpecShareError);
        // Could be "corrupted" or "invalid data"
        expect(String(err)).toMatch(/corrupted|invalid/i);
      }
    });

    it("rejects invalid JSON with clear error", () => {
      // Create a valid-looking but invalid spec (wrong structure)
      // Use proper compression so it passes the inflate step
      const badJson = '{"origin":{"x":0,"z":0}}';
      const jsonBytes = new TextEncoder().encode(badJson);
      const compressed = pako.deflate(jsonBytes);
      const withVersion = new Uint8Array(1 + compressed.length);
      withVersion[0] = 1; // version
      withVersion.set(compressed, 1);

      const base64 = Buffer.from(withVersion).toString("base64");
      const encoded = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

      try {
        decodeSpec(encoded);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SpecShareError);
        expect(String(err)).toContain("not contain a valid seed spec");
      }
    });
  });

  describe("error messages", () => {
    it("provide user-friendly messages for common failures", () => {
      const testCases: Array<[string, RegExp]> = [
        ["", /empty|invalid/i],
        ["!!!invalid", /corrupted|truncated/i],
      ];

      for (const [input, expectedMsg] of testCases) {
        try {
          decodeSpec(input);
          expect.fail(`Should have thrown for input: ${input}`);
        } catch (err) {
          expect(err).toBeInstanceOf(SpecShareError);
          expect(String(err)).toMatch(expectedMsg);
        }
      }
    });
  });
});
