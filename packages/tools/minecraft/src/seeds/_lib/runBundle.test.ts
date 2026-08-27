/**
 * A run bundle is read months after it is written, by a build that has moved
 * on. These tests pin the two properties that makes that safe: what goes out
 * comes back identical, and what is not a bundle this build understands is
 * refused rather than half-read.
 */
import { describe, expect, it } from "vitest";

import { IDLE_PROGRESS } from "./search";
import {
  buildRunBundle,
  packMismatch,
  parseRunBundle,
  RUN_BUNDLE_FORMAT,
  RunBundleError,
  runBundleCsv,
  type RunBundlePack,
} from "./runBundle";
import type { SpecEvalResult } from "./worker/seeds-api";

const HIT: SpecEvalResult = {
  // Past 2^53: the reason a seed is a string everywhere in this tool.
  seed: "-4844969194977269312",
  pass: true,
  score: 0.82,
  locations: {
    capital: {
      x: 512,
      z: -1024,
      hard: true,
      pass: true,
      score: 0.9,
      candidatesTried: 12,
      constraints: [{ type: "biome", pass: true, value: 1 }],
    },
    forest: {
      x: -300,
      z: 220,
      hard: false,
      pass: false,
      score: 0.3,
      candidatesTried: 40,
      constraints: [
        { type: "flatness", pass: false, value: 0.4, detail: "too steep" },
        { type: "water", pass: false, value: 0 },
      ],
    },
  },
  scan: { radius: 3000, step: 64, cells: 8836, waterMode: "auto" },
  geography: { waterBodies: 3, landMasses: 2, largestWaterArea: 900, largestLandArea: 4000 },
};

const PACKS: RunBundlePack[] = [
  { id: "vanilla", version: "1.21.1", bundle: "vanilla-1.21.1.e8c9588c.bin" },
  { id: "terralith", version: "2.6.2", bundle: "terralith-2.6.2.0a2b82ad.bin" },
];

const BUNDLE = buildRunBundle({
  packs: PACKS,
  uiSpec: { origin: [0, 0], scan: { radius: 3000 }, locations: [{ name: "capital" }] },
  coreSpec: { origin: [0, 0], locations: { capital: {} } },
  progress: { ...IDLE_PROGRESS, total: 10000, checked: 10000, evaluated: 610, hits: 4, elapsedMs: 91000 },
  hits: [HIT],
  exportedAt: "2026-08-27T10:00:00.000Z",
});

describe("run bundle round-trip", () => {
  const back = parseRunBundle(JSON.stringify(BUNDLE));

  it("returns the hits unchanged, seed precision included", () => {
    expect(back.hits).toEqual([HIT]);
    expect(back.hits[0]!.seed).toBe("-4844969194977269312");
  });

  it("keeps both specs apart", () => {
    expect(back.spec.core).toEqual(BUNDLE.spec.core);
    expect(back.spec.ui).toEqual(BUNDLE.spec.ui);
  });

  it("keeps the pack stack and the run's own counters", () => {
    expect(back.packs).toEqual(PACKS);
    expect(back.run.evaluated).toBe(610);
    // The rate the spec achieved, not the number of rows in the file.
    expect(back.run.hits).toBe(4);
  });
});

describe("run bundle refusals", () => {
  it("refuses a format it does not know", () => {
    const alien = JSON.stringify({ ...BUNDLE, format: "boffmedia.seedfinder.run/2" });
    expect(() => parseRunBundle(alien)).toThrow(RunBundleError);
  });

  it("refuses a file that is not JSON at all", () => {
    expect(() => parseRunBundle("<html>")).toThrow(RunBundleError);
  });

  it("refuses a bundle whose hits are missing the fields the panel reads", () => {
    const broken = JSON.stringify({ ...BUNDLE, hits: [{ seed: "1", score: 1 }] });
    expect(() => parseRunBundle(broken)).toThrow(RunBundleError);
  });

  it("accepts the format constant it writes", () => {
    expect(BUNDLE.format).toBe(RUN_BUNDLE_FORMAT);
  });
});

describe("pack mismatch", () => {
  it("is empty for the same stack", () => {
    expect(packMismatch(PACKS, PACKS)).toEqual([]);
  });

  it("catches a rebuilt bundle behind an unchanged version", () => {
    const rebuilt = [PACKS[0]!, { ...PACKS[1]!, bundle: "terralith-2.6.2.ffffffff.bin" }];
    expect(packMismatch(PACKS, rebuilt)).toEqual(["terralith"]);
  });

  it("catches a pack on only one side, in either direction", () => {
    expect(packMismatch(PACKS, [PACKS[0]!])).toEqual(["terralith"]);
    expect(packMismatch([PACKS[0]!], PACKS)).toEqual(["terralith"]);
  });
});

describe("csv", () => {
  const csv = runBundleCsv([HIT]);
  const [header, row] = csv.replace(/^﻿/, "").trim().split("\r\n");

  it("puts one column block per location, in a stable order", () => {
    expect(header).toBe(
      "seed,pass,score,water_bodies,land_masses,largest_water_area,largest_land_area," +
        "capital_x,capital_z,capital_pass,capital_score,capital_failed," +
        "forest_x,forest_z,forest_pass,forest_score,forest_failed",
    );
  });

  it("names the constraints that rejected a site", () => {
    expect(row).toContain("flatness;water");
  });

  it("writes one row per seed", () => {
    expect(csv.trim().split("\r\n")).toHaveLength(2);
  });
});
