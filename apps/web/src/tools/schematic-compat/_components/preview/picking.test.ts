import { describe, expect, it } from "vitest";
import { buildPickIndex, cutoffCount, ddaPick, maxSliceCount, sliceRange } from "./picking";
import type { BlockPositionGroup, UnifiedBlock } from "../../_lib/types";

function block(id: string): UnifiedBlock {
  return { id, namespace: "minecraft", name: id.split(":")[1] ?? id, states: {}, tags: [], source: "vanilla" };
}

function group(
  paletteIndex: number,
  id: string,
  positions: number[],
  interior?: number[],
): BlockPositionGroup {
  return {
    paletteIndex,
    block: block(id),
    positions: new Float32Array(positions),
    ...(interior ? { interiorPositions: new Float32Array(interior) } : {}),
  };
}

describe("maxSliceCount", () => {
  it("returns 0 for an empty array", () => {
    expect(maxSliceCount(new Float32Array(0))).toBe(0);
  });

  it("returns the largest single-Y run", () => {
    // y runs: [0,0] then [1] → largest is 2
    expect(maxSliceCount(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))).toBe(2);
  });

  it("counts a single plane fully", () => {
    expect(maxSliceCount(new Float32Array([0, 3, 0, 1, 3, 0, 2, 3, 0, 3, 3, 0]))).toBe(4);
  });
});

describe("cutoffCount", () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0]); // y = 0,0,1,2

  it("trims to the cutoff layer", () => {
    expect(cutoffCount(positions, 0)).toBe(2);
    expect(cutoffCount(positions, 1)).toBe(3);
  });

  it("keeps everything at/above the top layer", () => {
    expect(cutoffCount(positions, 2)).toBe(4);
    expect(cutoffCount(positions, 99)).toBe(4);
  });

  it("hides everything below layer 0", () => {
    expect(cutoffCount(positions, -1)).toBe(0);
  });
});

describe("sliceRange", () => {
  const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0]); // y = 0,0,1,2

  it("finds the window of a present layer", () => {
    expect(sliceRange(positions, 0)).toEqual([0, 2]);
    expect(sliceRange(positions, 1)).toEqual([2, 1]);
    expect(sliceRange(positions, 2)).toEqual([3, 1]);
  });

  it("returns an empty window for an absent layer", () => {
    const sparse = new Float32Array([0, 0, 0, 0, 2, 0]); // y = 0,2
    expect(sliceRange(sparse, 1)[1]).toBe(0);
    expect(sliceRange(positions, 3)[1]).toBe(0);
  });
});

describe("buildPickIndex + ddaPick", () => {
  const dims = { x: 8, y: 8, z: 8 };
  // stone (surface) at (1,1,1); dirt (interior) at (2,2,2); stone (surface) at (3,2,2)
  const groups = [
    group(0, "minecraft:stone", [1, 1, 1, 3, 2, 2]),
    group(1, "minecraft:dirt", [], [2, 2, 2]),
  ];
  const index = buildPickIndex(groups, dims);

  it("hits a surface block along an axis ray, entering from outside the grid", () => {
    expect(ddaPick({ x: -3, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }, index, 7, 50)).toBe("minecraft:stone");
  });

  it("misses when nothing is on the ray", () => {
    expect(ddaPick({ x: -3, y: 6, z: 6 }, { x: 1, y: 0, z: 0 }, index, 7, 50)).toBeNull();
  });

  it("ignores surface blocks above the layer cutoff", () => {
    expect(ddaPick({ x: -3, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }, index, 0, 50)).toBeNull();
  });

  it("skips an interior block unless the cutoff sits exactly on its layer", () => {
    // layerY 7 → interior at y=2 is enclosed/invisible; the ray falls through to
    // the surface stone behind it.
    expect(ddaPick({ x: -3, y: 2, z: 2 }, { x: 1, y: 0, z: 0 }, index, 7, 50)).toBe("minecraft:stone");
    // layerY 2 → slicing exposes the interior dirt first.
    expect(ddaPick({ x: -3, y: 2, z: 2 }, { x: 1, y: 0, z: 0 }, index, 2, 50)).toBe("minecraft:dirt");
  });

  it("hits immediately when the origin is inside a block", () => {
    expect(ddaPick({ x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 0 }, index, 7, 50)).toBe("minecraft:stone");
  });

  it("walks diagonals", () => {
    const s = -1 / Math.sqrt(3);
    expect(ddaPick({ x: 4, y: 4, z: 4 }, { x: s, y: s, z: s }, index, 2, 50)).toBe("minecraft:dirt");
  });

  it("respects maxDist", () => {
    expect(ddaPick({ x: -30, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }, index, 7, 5)).toBeNull();
  });

  it("uses the sparse backing above the dense limit and still resolves hits", () => {
    const bigDims = { x: 300, y: 300, z: 300 }; // 27M cells > DENSE_PICK_LIMIT
    const sparse = buildPickIndex([group(4, "minecraft:obsidian", [150, 150, 150])], bigDims);
    expect(ddaPick({ x: 140, y: 150, z: 150 }, { x: 1, y: 0, z: 0 }, sparse, 299, 50)).toBe(
      "minecraft:obsidian",
    );
    expect(ddaPick({ x: 140, y: 151, z: 150 }, { x: 1, y: 0, z: 0 }, sparse, 299, 50)).toBeNull();
  });
});
