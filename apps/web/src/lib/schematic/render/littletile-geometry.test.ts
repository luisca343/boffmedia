import { describe, expect, it } from "vitest";
import { buildTransformedArrays } from "./littletile-geometry";

/*
 * Ramp slice lifted from the mod's own splitting behavior: extractBox keeps a
 * multi-block slope's ORIGINAL absolute corners and only shrinks the bounds to
 * the host block (LittleTransformableBox.extractBox, identical in 1.12/1.21).
 * A 2-block ramp ascending east, sliced to its western block: corners run to
 * x = +1.5 while the cell (and the box bounds) end at +0.5. The mod renders
 * hexahedron ∩ bounds — the viewer must too, or the slice spills a whole cell.
 *
 * World corners in EUN…WDS order for host (0,0,0), grid 16.
 */
const RAMP_CORNERS = new Float32Array([
  1.5, 0.5, -0.5, // EUN
  1.5, 0.5, 0.5, // EUS
  1.5, -0.5, -0.5, // EDN
  1.5, -0.5, 0.5, // EDS
  -0.5, -0.5, -0.5, // WUN (pulled onto the bottom-west edge)
  -0.5, -0.5, 0.5, // WUS
  -0.5, -0.5, -0.5, // WDN
  -0.5, -0.5, 0.5, // WDS
]);
const CELL_BOUNDS = new Float32Array([-0.5, -0.5, -0.5, 0.5, 0.5, 0.5]);

/* The in-bounds wedge from littletiles-transform.test.ts, world-placed at
 * host (0,0,0), grid 16: bounds [3,8,8,5,12,9] with WUN/WUS pulled east. */
const WEDGE_CORNERS = new Float32Array([
  [5, 12, 8], [5, 12, 9], [5, 8, 8], [5, 8, 9],
  [5, 12, 8], [5, 12, 9], [3, 8, 8], [3, 8, 9],
].flatMap(([x, y, z]) => [x / 16 - 0.5, y / 16 - 0.5, z / 16 - 0.5]));
const WEDGE_BOUNDS = new Float32Array(
  [3, 8, 8, 5, 12, 9].map((v) => v / 16 - 0.5),
);

const EPS = 1e-3;

function positionsWithin(positions: Float32Array, bounds: Float32Array): boolean {
  for (let i = 0; i < positions.length; i += 3) {
    for (let ax = 0; ax < 3; ax++) {
      const v = positions[i + ax];
      if (v < bounds[ax] - EPS || v > bounds[3 + ax] + EPS) return false;
    }
  }
  return true;
}

describe("buildTransformedArrays", () => {
  it("clips a split-slope slice to its box bounds instead of spilling into neighbor cells", () => {
    const { positions, boxVertEnd } = buildTransformedArrays(
      RAMP_CORNERS,
      undefined,
      CELL_BOUNDS,
    );

    // Regression: the raw hexahedron reaches x = 1.5, a full cell beyond the
    // host. Every emitted vertex must stay inside the box's own AABB.
    expect(positions.length).toBeGreaterThan(0);
    expect(positionsWithin(positions, CELL_BOUNDS)).toBe(true);
    expect(boxVertEnd).toHaveLength(1);
    expect(boxVertEnd[0]).toBe(positions.length / 3);
  });

  it("cuts the slope plane, not clamps it: the ramp exits the cell at half height", () => {
    const { positions } = buildTransformedArrays(RAMP_CORNERS, undefined, CELL_BOUNDS);

    // The full ramp rises 1 block over 2 cells, so inside this cell its
    // surface tops out at y = 0 exactly on the east wall. Per-axis clamping
    // of the corners would instead produce a full-height 45° wedge (y = 0.5).
    let maxY = -Infinity;
    for (let i = 1; i < positions.length; i += 3) maxY = Math.max(maxY, positions[i]);
    expect(maxY).toBeCloseTo(0, 3);
  });

  it("emits in-bounds slopes verbatim (36 vertices, corners untouched)", () => {
    const raw = buildTransformedArrays(WEDGE_CORNERS, undefined);
    const bounded = buildTransformedArrays(WEDGE_CORNERS, undefined, WEDGE_BOUNDS);

    expect(bounded.boxVertEnd[0]).toBe(36);
    expect([...bounded.positions]).toEqual([...raw.positions]);
    expect(positionsWithin(bounded.positions, WEDGE_BOUNDS)).toBe(true);
  });

  it("keeps per-box colors aligned across variable clipped vertex counts", () => {
    const corners = new Float32Array(48);
    corners.set(RAMP_CORNERS, 0);
    corners.set(WEDGE_CORNERS, 24);
    const bounds = new Float32Array(12);
    bounds.set(CELL_BOUNDS, 0);
    bounds.set(WEDGE_BOUNDS, 6);
    const colors = new Float32Array([1, 0, 0, 0, 1, 0]);

    const { positions, colors: vertColors, boxVertEnd } = buildTransformedArrays(
      corners,
      colors,
      bounds,
    );

    expect(vertColors).not.toBeNull();
    expect(vertColors!.length).toBe(positions.length);
    // Every vertex of box 0 is red, every vertex of box 1 is green.
    for (let v = 0; v < boxVertEnd[0]; v++) {
      expect(vertColors![v * 3]).toBe(1);
      expect(vertColors![v * 3 + 1]).toBe(0);
    }
    for (let v = boxVertEnd[0]; v < boxVertEnd[1]; v++) {
      expect(vertColors![v * 3]).toBe(0);
      expect(vertColors![v * 3 + 1]).toBe(1);
    }
  });
});
