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
): TileEntity {
  return { pos, id: "minecraft:littletilestileentity", data: { content } };
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
  });
});
