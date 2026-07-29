import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { loadSchematicFile } from "@/lib/schematic/loader";
import type { LittleTilesGroup, SchematicStructure } from "@/lib/schematic/types";
import { convertLittleTilesForExport } from "./littletiles-writer";
import { writeSchem } from "./schem-writer";

const ROOT = "/home/luisca/Programacion/Ficus Labs/boffmedia";

function fileFrom(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

function fixture(name: string): File {
  const b = readFileSync(`${ROOT}/docs/schem/${name}`);
  return fileFrom(new Uint8Array(b), name);
}

/** Comparable shape: material id → sorted box + slope-corner coordinate lists. */
function boxesById(groups: LittleTilesGroup[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const g of groups) {
    const list: string[] = [];
    for (let i = 0; i < g.boxes.length; i += 9) list.push([...g.boxes.slice(i, i + 9)].join(","));
    const corners = g.corners ?? new Float32Array(0);
    for (let i = 0; i < corners.length; i += 24) {
      list.push("t:" + [...corners.slice(i, i + 24)].join(","));
    }
    out[g.block.id] = list.sort();
  }
  return out;
}

async function reload(structure: SchematicStructure, name: string) {
  return loadSchematicFile(fileFrom(writeSchem(structure, 2), name));
}

describe("LittleTiles 1.12 → modern roundtrip", () => {
  it("converts the 1.12 fixture and the modern parser reads back identical boxes", async () => {
    const legacy = await loadSchematicFile(fixture("PRUEBA_LITTLE.schematic"));
    expect(legacy.littleTiles).toBeDefined();

    const converted = await convertLittleTilesForExport(legacy);
    // Hosts re-stamped to the modern host block with its written state.
    const host = converted.palette.find((b) => b.id === "littletiles:tiles");
    expect(host?.states).toEqual({ waterlogged: "false" });

    const back = await reload(converted, "roundtrip.schem");
    expect(back.format).toBe("schem");
    expect(back.littleTiles).toBeDefined();
    expect(back.littleTiles!.blockCount).toBe(legacy.littleTiles!.blockCount);
    expect(back.littleTiles!.tileCount).toBe(legacy.littleTiles!.tileCount);
    expect(boxesById(back.littleTiles!.groups)).toEqual(boxesById(legacy.littleTiles!.groups));
  });

  it("applies material resolutions through littleTiles.materialMap", async () => {
    const legacy = await loadSchematicFile(fixture("PRUEBA_LITTLE.schematic"));
    const withMap: SchematicStructure = {
      ...legacy,
      littleTiles: {
        ...legacy.littleTiles!,
        materialMap: { "minecraft:magenta_wool": "minecraft:red_wool" },
      },
    };

    const back = await reload(await convertLittleTilesForExport(withMap), "resolved.schem");
    const ids = back.littleTiles!.groups.map((g) => g.block.id);
    expect(ids).toContain("minecraft:red_wool");
    expect(ids).not.toContain("minecraft:magenta_wool");
    // Unresolved materials pass through untouched.
    expect(ids).toContain("appliedenergistics2:sky_stone_block");
  });

  it("a material resolved to air deletes those tiles", async () => {
    const legacy = await loadSchematicFile(fixture("PRUEBA_LITTLE.schematic"));
    const withMap: SchematicStructure = {
      ...legacy,
      littleTiles: {
        ...legacy.littleTiles!,
        materialMap: { "appliedenergistics2:sky_stone_block": "minecraft:air" },
      },
    };

    const back = await reload(await convertLittleTilesForExport(withMap), "air.schem");
    const ids = back.littleTiles!.groups.map((g) => g.block.id);
    expect(ids).not.toContain("appliedenergistics2:sky_stone_block");
    expect(back.littleTiles!.tileCount).toBeLessThan(legacy.littleTiles!.tileCount);
  });

  it("transformable boxes (slopes) survive conversion with their corner data", async () => {
    const wedge = [3, 8, 8, 5, 12, 9, 0x80009000 | 0, 0x00020002];
    const legacy: SchematicStructure = {
      format: "mcedit",
      formatVersion: 1,
      dimensions: { x: 1, y: 1, z: 1 },
      palette: [
        { id: "minecraft:stone", namespace: "minecraft", name: "stone", states: {}, tags: [], source: "vanilla" },
      ],
      blockData: new Int32Array([0]),
      tileEntities: [
        {
          pos: { x: 0, y: 0, z: 0 },
          id: "minecraft:littletilestileentity",
          data: {
            content: {
              grid: 16,
              tiles: [{ block: "minecraft:stone", box: new Int32Array(wedge) }],
            },
          },
        },
      ],
      entities: [],
      littleTiles: { blockCount: 1, tileCount: 1, groups: [] },
      metadata: {},
    };

    const converted = await convertLittleTilesForExport(legacy);
    const te = converted.tileEntities.find((t) => t.id === "littletiles:tiles")!;
    const tiles = (te.data.content as { tiles: Record<string, Int32Array[]> }).tiles;
    const boxes = tiles["minecraft:stone"].filter((a) => a.length > 1);
    // Modern extended layout: faceCache 0, then the legacy array verbatim.
    expect([...boxes[0]]).toEqual([0, ...wedge]);

    const back = await reload(converted, "wedge.schem");
    const g = back.littleTiles!.groups.find((x) => x.block.id === "minecraft:stone")!;
    expect(g.corners).toBeDefined();
    expect(g.corners!.length).toBe(24);
  });

  it("modern LT content passes through export byte-faithfully", async () => {
    const modern = await loadSchematicFile(fixture("PRUEBA_1.21_LITTLE.schem"));
    expect(modern.littleTiles).toBeDefined();

    const back = await reload(await convertLittleTilesForExport(modern), "modern.schem");
    expect(back.littleTiles!.tileCount).toBe(modern.littleTiles!.tileCount);
    expect(boxesById(back.littleTiles!.groups)).toEqual(boxesById(modern.littleTiles!.groups));
    // The tinted colored_clean tile keeps its colour.
    const tinted = back.littleTiles!.groups.find((g) => g.block.id === "littletiles:colored_clean");
    expect(tinted?.colors).toBeDefined();
  });
});
