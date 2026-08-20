import { describe, expect, it } from "vitest";
import {
  decodeTransformableCorners,
  isTransformableBox,
  parseLittleTiles,
} from "./littletiles";
import { loadLegacyTables } from "./legacy/legacy-mapper";
import type { TileEntity } from "../types";

/*
 * The transformable-box sample and the structure layout below are lifted from
 * a real 1.12.2 world (r.-5.-9.mca): a wedge whose top-west corners are pulled
 * east, and a door whose member blocks each carry their own tiles in a
 * `children` entry whose `coord` points at the structure's main block.
 */

// indicator: bit 31 (transformable marker) + bits 12 (corner WUN, x) and 15
// (corner WUS, x); one data int packing shorts [+2, +2], HIGH half first.
const WEDGE = [3, 8, 8, 5, 12, 9, 0x80009000 | 0, 0x00020002];

// A 2-block ramp's western slice, as the mod's extractBox saves it: bounds
// shrunk to one block but the ORIGINAL absolute corners kept — E corners sit
// at x = 32, a full block past maxX = 16 (offsets +16 on EUN/EUS/EDN/EDS x,
// −16 on WUN/WUS y). LittleTransformableBox renders hexahedron ∩ bounds.
const RAMP_SLICE = [0, 0, 0, 16, 16, 16, 0x80012249 | 0, 0x00100010, 0x00100010, 0xfff0fff0 | 0];

describe("decodeTransformableCorners", () => {
  it("detects the transformable marker", () => {
    expect(isTransformableBox(WEDGE)).toBe(true);
    expect(isTransformableBox([0, 0, 0, 1, 1, 1])).toBe(false);
    // Pre-1.5 slice formats carry a non-negative id at index 6.
    expect(isTransformableBox([0, 0, 0, 1, 1, 1, 3, 0])).toBe(false);
  });

  it("applies signed corner offsets to the AABB corners in BoxCorner order", () => {
    const c = decodeTransformableCorners(WEDGE);
    // EUN, EUS, EDN, EDS stay on the east face of the bounds.
    expect([...c.slice(0, 12)]).toEqual([5, 12, 8, 5, 12, 9, 5, 8, 8, 5, 8, 9]);
    // WUN and WUS moved +2 in x (onto the east face → the top collapses).
    expect([...c.slice(12, 18)]).toEqual([5, 12, 8, 5, 12, 9]);
    // WDN, WDS stay at the west-bottom bounds.
    expect([...c.slice(18, 24)]).toEqual([3, 8, 8, 3, 8, 9]);
  });

  it("preserves out-of-bounds corners of a split slope (extractBox keeps the original plane)", () => {
    const c = decodeTransformableCorners(RAMP_SLICE);
    // East corners a full block past maxX — faithful decode, no clamping.
    expect([c[0], c[3], c[6], c[9]]).toEqual([32, 32, 32, 32]);
    // West-up corners folded onto the bottom.
    expect([c[13], c[16]]).toEqual([0, 0]);
  });

  it("sign-extends negative packed offsets", () => {
    // Corner EUN, offset x = −3 (0xfffd in the HIGH half).
    const box = [0, 0, 0, 4, 4, 4, 0x80000001 | 0, 0xfffd0000 | 0];
    const c = decodeTransformableCorners(box);
    expect(c[0]).toBe(1); // maxX 4 − 3
  });
});

function legacyTE(
  pos: { x: number; y: number; z: number },
  content: Record<string, unknown>,
  rootExtra: Record<string, unknown> = {},
): TileEntity {
  return { pos, id: "minecraft:littletilestileentity", data: { ...rootExtra, content } };
}

describe("legacy structure placement", () => {
  it("keeps child tiles in their own TE cell and ignores the coord pointer", async () => {
    const tables = await loadLegacyTables();
    const tile = { block: "minecraft:stone", box: new Int32Array([0, 0, 0, 8, 8, 8]) };
    const tes = [
      // Structure main block: its share lives in a coord-less child.
      legacyTE({ x: 5, y: 0, z: 0 }, {
        tiles: [],
        children: [{ tiles: [tile], index: 0, type: 0, structure: { id: "door" } }],
      }),
      // Member block: its share lives in a child whose coord points at the main.
      legacyTE({ x: 6, y: 0, z: 0 }, {
        tiles: [],
        children: [{ tiles: [tile], index: 0, type: 0, coord: new Int32Array([-1, 0, 0]) }],
      }),
    ];

    const lt = parseLittleTiles(tes, tables)!;
    expect(lt.tileCount).toBe(2);
    const hosts = [];
    const boxes = lt.groups[0].boxes;
    for (let i = 0; i < boxes.length; i += 9) hosts.push(boxes[i]);
    expect(hosts.sort()).toEqual([5, 6]);
  });

  it("assembles a structure instance from its main block and coord-linked members", async () => {
    const tables = await loadLegacyTables();
    const tile = { block: "minecraft:stone", box: new Int32Array([0, 0, 0, 8, 8, 8]) };
    const tes = [
      legacyTE({ x: 5, y: 0, z: 0 }, {
        tiles: [],
        children: [{ tiles: [tile], structure: { id: "door", name: "front-door" } }],
      }),
      legacyTE({ x: 6, y: 0, z: 0 }, {
        tiles: [],
        children: [{ tiles: [tile], coord: new Int32Array([-1, 0, 0]) }],
      }),
      // A free-tile block: must not join any structure.
      legacyTE({ x: 9, y: 0, z: 0 }, { tiles: [tile] }),
    ];

    const lt = parseLittleTiles(tes, tables)!;
    expect(lt.structures).toHaveLength(1);
    const s = lt.structures![0];
    expect(s.type).toBe("door");
    expect(s.name).toBe("front-door");
    expect(s.mainPos).toEqual({ x: 5, y: 0, z: 0 });
    expect(s.blockCount).toBe(2);
    expect(s.tileCount).toBe(2);
    // Two stride-9 boxes, hosted at x=5 and x=6 — the free tile at x=9 stays out.
    expect(s.boxes.length).toBe(18);
    expect([s.boxes[0], s.boxes[9]].sort()).toEqual([5, 6]);
  });

  it("marks a member whose main block is outside the schematic as unknown", async () => {
    const tables = await loadLegacyTables();
    const tile = { block: "minecraft:stone", box: new Int32Array([0, 0, 0, 8, 8, 8]) };
    const tes = [
      legacyTE({ x: 0, y: 0, z: 0 }, {
        tiles: [],
        children: [{ tiles: [tile], coord: new Int32Array([-5, 0, 0]) }],
      }),
    ];

    const lt = parseLittleTiles(tes, tables)!;
    expect(lt.structures).toHaveLength(1);
    expect(lt.structures![0].type).toBe("unknown");
    expect(lt.structures![0].mainPos).toEqual({ x: -5, y: 0, z: 0 });
    expect(lt.structures![0].tileCount).toBe(1);
  });

  it("reads the 1.12 grid from the TE data root, where the mod saves it", async () => {
    // TileEntityLittleTiles.writeToNBT writes the grid on the ROOT compound
    // (context.set(nbt)) and only when non-default. Miss it and a full grid-2
    // block read as grid 16 shrinks to 1/8.
    const tables = await loadLegacyTables();
    const tes = [
      legacyTE(
        { x: 0, y: 0, z: 0 },
        { tiles: [{ block: "minecraft:brick_block", box: new Int32Array([0, 0, 0, 2, 2, 2]) }] },
        { grid: 2 },
      ),
    ];

    const boxes = parseLittleTiles(tes, tables)!.groups[0].boxes;
    // Fractions span the full cell: [x0,y0,z0] = 0, [x1,y1,z1] = 2/2 = 1.
    expect([boxes[3], boxes[4], boxes[5]]).toEqual([0, 0, 0]);
    expect([boxes[6], boxes[7], boxes[8]]).toEqual([1, 1, 1]);
  });

  it("groups transformable boxes as world-space corners, not scaled cubes", async () => {
    const tables = await loadLegacyTables();
    const tes = [
      legacyTE({ x: 0, y: 0, z: 0 }, {
        grid: 16,
        tiles: [{ block: "minecraft:stone", box: new Int32Array(WEDGE) }],
      }),
    ];

    const g = parseLittleTiles(tes, tables)!.groups[0];
    expect(g.boxes.length).toBe(0);
    expect(g.corners!.length).toBe(24);
    expect(g.cornerHostY!.length).toBe(1);
    // WDN corner: cell origin −0.5 plus 3/16, 8/16, 8/16.
    expect(g.corners![18]).toBeCloseTo(-0.5 + 3 / 16);
    expect(g.corners![19]).toBeCloseTo(-0.5 + 8 / 16);
    expect(g.corners![20]).toBeCloseTo(-0.5 + 8 / 16);
    // The box's own min/max travel with the corners as the clip AABB.
    expect([...g.cornerBounds!]).toEqual([
      -0.5 + 3 / 16, -0.5 + 8 / 16, -0.5 + 8 / 16,
      -0.5 + 5 / 16, -0.5 + 12 / 16, -0.5 + 9 / 16,
    ]);
  });

  it("exposes world-space clip bounds for a slope slice whose corners spill past them", async () => {
    const tables = await loadLegacyTables();
    const tes = [
      legacyTE({ x: 4, y: 10, z: -2 }, {
        grid: 16,
        tiles: [{ block: "minecraft:stone", box: new Int32Array(RAMP_SLICE) }],
      }),
    ];

    const g = parseLittleTiles(tes, tables)!.groups[0];
    // Corners stay the faithful decode — EUN reaches x = host + 1.5…
    expect(g.corners![0]).toBeCloseTo(4 - 0.5 + 32 / 16);
    // …while the clip AABB is exactly the host cell (bounds 0…16 at grid 16),
    // which is what keeps the rendered slice from spilling into x = 5.
    expect([...g.cornerBounds!]).toEqual([3.5, 9.5, -2.5, 4.5, 10.5, -1.5]);
    const s = parseLittleTiles(tes, tables)!;
    expect(s.groups[0].cornerBounds!.length).toBe((s.groups[0].corners!.length / 24) * 6);
  });
});
