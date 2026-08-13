import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadSchematicFile } from "../../../../engine/loader";
import type { TileEntity } from "../../../../engine/types";
import { convertLittleTilesForExport } from "./littletiles-writer";

const ROOT = "/home/luisca/Programacion/Ficus Labs/boffmedia";

function fixture(name: string): File {
  const b = readFileSync(`${ROOT}/docs/schem/${name}`);
  const bytes = new Uint8Array(b);
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

/** faceCache nibbles in CreativeCore Facing order. */
function faces(cache: number): Record<string, number> {
  const order = ["down", "up", "north", "south", "west", "east"];
  const out: Record<string, number> = {};
  order.forEach((name, i) => (out[name] = (cache >> (i * 4)) & 15));
  return out;
}

function tilesAt(converted: { tileEntities: TileEntity[] }, x: number, y: number, z: number) {
  const te = converted.tileEntities.find(
    (t) => t.pos.x === x && t.pos.y === y && t.pos.z === z && t.id === "littletiles:tiles",
  )!;
  const content = te.data.content as { tiles: Record<string, Int32Array[]> };
  return content.tiles;
}

// LittleFaceState ordinals: 1..3 inside (un/partially/fully covered),
// 4..6 outside (un/partially/fully covered).
describe("LittleTiles exported face caches", () => {
  it("stamps mod-equivalent face states on the LA_PUERTA corner cell", async () => {
    const legacy = await loadSchematicFile(fixture("LA_PUERTA.schematic"));
    const converted = await convertLittleTilesForExport(legacy);
    const tiles = tilesAt(converted, 0, 0, 0);

    // bricks: [color], top box [0,9,0,16,16,16], edge slice [15,0,0,16,9,16]
    const bricks = tiles["minecraft:bricks"];
    const top = [...bricks[1]];
    const slice = [...bricks[2]];
    expect(top.slice(1)).toEqual([0, 9, 0, 16, 16, 16]);
    expect(slice.slice(1)).toEqual([15, 0, 0, 16, 9, 16]);

    // Slice: west face covered inside by the street box, up face covered by
    // the brick top, east face partially covered by the grid-2 neighbour at
    // (1,0,0) (only its back half touches the shared plane).
    expect(faces(slice[0])).toEqual({
      down: 4,
      up: 3,
      north: 4,
      south: 4,
      west: 3,
      east: 5,
    });

    // Top box: bottom face fully covered inside (street + slice tile the
    // y=9 plane), east face partially covered by the same neighbour.
    expect(faces(top[0])).toEqual({
      down: 3,
      up: 4,
      north: 4,
      south: 4,
      west: 4,
      east: 5,
    });

    const street = tiles["furenikusroads:street_block_b"];
    const box = [...street[1]];
    expect(box.slice(1)).toEqual([0, 0, 0, 15, 9, 16]);
    // Interior faces (east against the slice, up against the brick top) are
    // fully covered; every boundary face renders.
    expect(faces(box[0])).toEqual({
      down: 4,
      up: 3,
      north: 4,
      south: 4,
      west: 4,
      east: 3,
    });
  });

  it("marks every plain box with a valid non-lazy cache", async () => {
    const legacy = await loadSchematicFile(fixture("LA_PUERTA.schematic"));
    const converted = await convertLittleTilesForExport(legacy);
    for (const te of converted.tileEntities) {
      if (te.id !== "littletiles:tiles") continue;
      const content = te.data.content as {
        tiles: Record<string, Int32Array[]>;
        children: Array<{ tiles: Record<string, Int32Array[]> }>;
      };
      const lists = [
        ...Object.values(content.tiles),
        ...content.children.flatMap((c) => Object.values(c.tiles)),
      ];
      for (const list of lists) {
        for (const arr of list) {
          if (arr.length === 1) continue;
          if (arr.length >= 8 && arr[7] < 0) {
            expect(arr[0]).toBe(0); // transformables stay lazy
            continue;
          }
          expect(arr.length).toBe(7);
          expect(arr[0]).not.toBe(0);
          for (const f of Object.values(faces(arr[0]))) {
            expect(f).toBeGreaterThanOrEqual(1);
            expect(f).toBeLessThanOrEqual(6);
          }
        }
      }
    }
  });
});
