import { describe, expect, it } from "vitest";
import { createEngineState, getSchematicBlockPositions } from "./core-ops";
import { parseBlockState } from "../normalizer";
import type { BlockPositionGroup, SchematicStructure } from "../types";

/**
 * A fully solid cuboid of a single opaque block: every cell is that block, so the
 * only thing that classifies a cell as surface-vs-interior is its position (an
 * interior cell has all six neighbours solid). This is the shape that exercises
 * the surface/interior split, the CULL_THRESHOLD drop, and the stride cap — none
 * of which the 4×4×4 manual check ever reached.
 */
function solid(x: number, y: number, z: number, blockId = "minecraft:stone"): SchematicStructure {
  return {
    format: "schem",
    formatVersion: 2,
    dimensions: { x, y, z },
    palette: [parseBlockState(blockId)],
    blockData: new Int32Array(x * y * z), // all zeros → the single palette block
    tileEntities: [],
    entities: [],
    metadata: {},
  };
}

async function positionsFor(structure: SchematicStructure): Promise<BlockPositionGroup[]> {
  const state = createEngineState();
  state.schematics.set("s1", structure);
  return getSchematicBlockPositions(state, "s1");
}

const triplets = (a: Float32Array): number => a.length / 3;

describe("getSchematicBlockPositions surface/interior split", () => {
  it("splits a 16³ solid into a shell surface and a fully-enclosed interior, losing no block", async () => {
    const n = 16;
    const groups = await positionsFor(solid(n, n, n));

    expect(groups).toHaveLength(1);
    const g = groups[0];
    expect(g.paletteIndex).toBe(0);
    expect(g.block.id).toBe("minecraft:stone");

    const surface = triplets(g.positions);
    const interior = triplets(g.interiorPositions!);

    // The contract: interior = the (n-2)³ inner cube (every neighbour solid),
    // surface = the outer shell, and the two partition every non-air block.
    const expectedInterior = (n - 2) ** 3; // 2744
    const expectedSurface = n ** 3 - expectedInterior; // 1352
    expect(interior).toBe(expectedInterior);
    expect(surface).toBe(expectedSurface);
    expect(surface + interior).toBe(n ** 3); // 4096 — nothing dropped

    // Interior culling is genuinely happening: 2744 cells are NOT in the
    // always-drawn surface set, so far fewer instances render than blocks exist.
    expect(interior).toBeGreaterThan(0);
    expect(surface).toBeLessThan(n ** 3);

    // Every surface triplet touches a face; every interior triplet is strictly inside.
    let allSurfaceOnFace = true;
    for (let i = 0; i < g.positions.length; i += 3) {
      const x = g.positions[i], y = g.positions[i + 1], z = g.positions[i + 2];
      const onFace = x === 0 || y === 0 || z === 0 || x === n - 1 || y === n - 1 || z === n - 1;
      if (!onFace) allSurfaceOnFace = false;
    }
    expect(allSurfaceOnFace).toBe(true);

    let allInteriorEnclosed = true;
    for (let i = 0; i < g.interiorPositions!.length; i += 3) {
      const x = g.interiorPositions![i], y = g.interiorPositions![i + 1], z = g.interiorPositions![i + 2];
      const enclosed = x > 0 && x < n - 1 && y > 0 && y < n - 1 && z > 0 && z < n - 1;
      if (!enclosed) allInteriorEnclosed = false;
    }
    expect(allInteriorEnclosed).toBe(true);

    // Positions are Y-outer (the UI binary-searches them by Y).
    let ySorted = true;
    let prevY = -Infinity;
    for (let i = 1; i < g.positions.length; i += 3) {
      if (g.positions[i] < prevY) ySorted = false;
      prevY = g.positions[i];
    }
    expect(ySorted).toBe(true);
  });

  it("emits a lone 1×1×1 block as a single surface instance with no interior", async () => {
    const groups = await positionsFor(solid(1, 1, 1));
    expect(groups).toHaveLength(1);
    expect(triplets(groups[0].positions)).toBe(1);
    expect(groups[0].interiorPositions).toBeUndefined();
  });

  it("treats a single-layer plate as all-surface (no cell is enclosed)", async () => {
    const groups = await positionsFor(solid(4, 1, 4));
    expect(triplets(groups[0].positions)).toBe(16);
    expect(groups[0].interiorPositions).toBeUndefined();
  });

  it("drops interiors entirely once renderable blocks pass CULL_THRESHOLD", async () => {
    // 120³ = 1,728,000 non-air blocks > the 1,500,000 threshold, so interiors are
    // never allocated — the viewer gets a hollow shell.
    const n = 120;
    const groups = await positionsFor(solid(n, n, n));
    const g = groups[0];
    expect(g.interiorPositions).toBeUndefined();
    expect(triplets(g.positions)).toBe(n ** 3 - (n - 2) ** 3); // 84,968 shell cells only
  });

  it("strides an oversized surface down to fit the instance cap", async () => {
    // A 1500×1×1500 plate is 2,250,000 all-surface cells, over the 2,000,000
    // MAX_INSTANCES cap, so the group is strided (stride 2 → every other cell).
    const surface = 1500 * 1500; // 2,250,000
    const groups = await positionsFor(solid(1500, 1, 1500));
    const g = groups[0];
    const stride = Math.ceil(surface / 2_000_000); // 2
    expect(triplets(g.positions)).toBe(Math.ceil(surface / stride)); // 1,125,000
    expect(triplets(g.positions)).toBeLessThan(surface); // striding actually thinned it
    expect(g.interiorPositions).toBeUndefined();
  });
});
