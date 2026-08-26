/**
 * The walking-distance metric must be direction-neutral: the old 4-neighbour
 * BFS measured Manhattan paths, so a perfectly clean diagonal route read a
 * detour factor of 1.414 — past the 1.4 "ideal" band — purely because of its
 * bearing. Octile movement keeps every bearing within ~1% of the truth.
 */
import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore plain-JS core module
import { Geography, distanceField, fieldDistanceTo, walkingDistance } from "./geography.mjs";

const STEP = 192;

function maskOf(rows: string[]): { step: number; x0: number; z0: number; nx: number; nz: number; water: Uint8Array } {
  const nz = rows.length;
  const nx = rows[0]!.length;
  const water = new Uint8Array(nx * nz);
  rows.forEach((row, jz) => {
    for (let jx = 0; jx < nx; jx++) water[jz * nx + jx] = row[jx] === "~" ? 1 : 0;
  });
  return { step: STEP, x0: 0, z0: 0, nx, nz, water };
}

const allLand = maskOf(Array.from({ length: 31 }, () => ".".repeat(31)));
const geoLand = Geography.analyse(allLand);

describe("octile walking distance", () => {
  it("reads ~1.0 detour on a straight cardinal route", () => {
    const r = walkingDistance(allLand, geoLand, 0, 0, 20 * STEP, 0)!;
    expect(r.detourFactor).toBeCloseTo(1.0, 2);
  });

  it("reads ~1.0 detour on a perfect diagonal (the old metric read 1.414)", () => {
    const r = walkingDistance(allLand, geoLand, 0, 0, 20 * STEP, 20 * STEP)!;
    expect(r.detourFactor).toBeGreaterThan(0.97);
    expect(r.detourFactor).toBeLessThan(1.03);
  });

  it("measures a real detour around a wall", () => {
    // A wall of water splits the route; the path must go around the end.
    const rows = Array.from({ length: 21 }, (_, jz) =>
      jz === 10 ? "~".repeat(20) + "." : ".".repeat(21),
    );
    const mask = maskOf(rows);
    const geo = Geography.analyse(mask);
    const r = walkingDistance(mask, geo, 0, 0, 0, 20 * STEP)!;
    expect(r.detourFactor).toBeGreaterThan(1.8);
  });

  it("returns null across water", () => {
    const rows = Array.from({ length: 21 }, (_, jz) =>
      jz === 10 ? "~".repeat(21) : ".".repeat(21),
    );
    const mask = maskOf(rows);
    const geo = Geography.analyse(mask);
    expect(walkingDistance(mask, geo, 0, 0, 0, 20 * STEP)).toBeNull();
  });

  it("cannot cut a corner two components only touch at", () => {
    // Land connected ONLY diagonally: 4-connected components differ, so the
    // walk must refuse the diagonal squeeze.
    const mask = maskOf([
      ".~~",
      "~.~",
      "~~.",
    ]);
    const geo = Geography.analyse(mask);
    expect(walkingDistance(mask, geo, 0, 0, 2 * STEP, 2 * STEP)).toBeNull();
  });

  it("field agrees with the one-shot helper", () => {
    const field = distanceField(allLand, geoLand, 10 * STEP, 10 * STEP);
    const viaField = fieldDistanceTo(allLand, field, 0, 0);
    const oneShot = walkingDistance(allLand, geoLand, 0, 0, 10 * STEP, 10 * STEP)!;
    expect(viaField).toBeCloseTo(oneShot.pathLength, 6);
  });
});
