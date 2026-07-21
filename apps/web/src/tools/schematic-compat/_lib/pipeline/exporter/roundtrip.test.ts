import { describe, expect, it } from "vitest";
// Round-trip proof for the lib loaders: each writer is the declared inverse of a
// loader, so writing a known structure and loading the bytes back exercises the
// real parse path. Placed tool-side so the dependency runs tool → lib (the writers
// live here; the loader is imported from lib), never lib → tool.
import { loadSchematicFile } from "@/lib/schematic/loader";
import { writeSchem } from "./schem-writer";
import { writeLitematic } from "./litematic-writer";
import { writeNbtStruct } from "./nbt-writer";
import { writePrefab } from "./prefab-writer";
import { parseBlockState } from "@/lib/schematic/normalizer";
import type { SchematicStructure, UnifiedBlock } from "@/lib/schematic/types";

/** Wrap bytes in the File shape `loadSchematicFile` expects (see loader/legacy-detect.test.ts). */
function asFile(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

const ids = (s: SchematicStructure): string[] => s.palette.map((b) => b.id);

/** Resolve the block id sitting at a YZX cell — palette-order-independent. */
function idAt(s: SchematicStructure, x: number, y: number, z: number): string {
  const { x: sx, z: sz } = s.dimensions;
  return s.palette[s.blockData[(y * sz + z) * sx + x]].id;
}

/**
 * A Minecraft structure with air pinned at palette index 0. `.nbt` is a sparse
 * format (air is never written and restored as the air index), so a clean block
 * data round-trip needs air at 0 — the same layout the litematic/schem dense
 * formats round-trip verbatim, so one fixture serves all three.
 */
function mcStructure(): SchematicStructure {
  const palette: UnifiedBlock[] = [
    parseBlockState("minecraft:air"),
    parseBlockState("minecraft:stone"),
    parseBlockState("minecraft:oak_stairs[facing=north,half=bottom]"),
  ];
  // 3×2×2, YZX-linear. Mix of air (0), stone (1), stairs (2).
  const blockData = Int32Array.of(
    1, 2, 0, /**/ 0, 1, 2, // y=0: z=0 row then z=1 row
    2, 0, 1, /**/ 1, 2, 0, // y=1
  );
  return {
    format: "schem",
    formatVersion: 2,
    dimensions: { x: 3, y: 2, z: 2 },
    palette,
    blockData,
    tileEntities: [],
    entities: [],
    metadata: {},
  };
}

/** A solid Hytale cuboid (no air) — the prefab writer emits only non-air blocks,
 *  so a gap-free build keeps its full extent through the bounding-box reload. */
function hytaleStructure(): SchematicStructure {
  const block = (name: string): UnifiedBlock => ({
    id: `hytale:${name}`,
    namespace: "hytale",
    name,
    states: {},
    tags: [],
    source: "vanilla",
  });
  const palette = [block("Stone"), block("Dirt")];
  // 2×2×2 solid, alternating the two blocks so per-cell placement is meaningful.
  const blockData = Int32Array.of(0, 1, 1, 0, 1, 0, 0, 1);
  return {
    format: "prefab",
    formatVersion: 8,
    dimensions: { x: 2, y: 2, z: 2 },
    palette,
    blockData,
    tileEntities: [],
    entities: [],
    metadata: { anchor: { x: 5, y: 6, z: 7 }, origin: { x: 10, y: 20, z: 30 } },
  };
}

function expectSameGrid(loaded: SchematicStructure, src: SchematicStructure): void {
  expect(loaded.dimensions).toEqual(src.dimensions);
  const { x: sx, y: sy, z: sz } = src.dimensions;
  for (let y = 0; y < sy; y++) {
    for (let z = 0; z < sz; z++) {
      for (let x = 0; x < sx; x++) {
        expect(idAt(loaded, x, y, z)).toBe(idAt(src, x, y, z));
      }
    }
  }
}

describe("schematic writer → loader round-trips", () => {
  it("schem v2 preserves dimensions, palette order and block data", async () => {
    const src = mcStructure();
    const loaded = await loadSchematicFile(asFile(writeSchem(src, 2), "b.schem"));
    expect(loaded.dimensions).toEqual(src.dimensions);
    expect(ids(loaded)).toEqual(ids(src));
    expect(Array.from(loaded.blockData)).toEqual(Array.from(src.blockData));
  });

  it("schem v3 preserves dimensions, palette order and block data", async () => {
    const src = mcStructure();
    const loaded = await loadSchematicFile(asFile(writeSchem(src, 3), "b.schem"));
    expect(loaded.formatVersion).toBe(3);
    expect(loaded.dimensions).toEqual(src.dimensions);
    expect(ids(loaded)).toEqual(ids(src));
    expect(Array.from(loaded.blockData)).toEqual(Array.from(src.blockData));
  });

  it("litematic bit-packs and decodes back to the exact dense grid", async () => {
    const src = mcStructure();
    const loaded = await loadSchematicFile(asFile(writeLitematic(src), "b.litematic"));
    expect(loaded.format).toBe("litematic");
    expect(loaded.dimensions).toEqual(src.dimensions);
    expect(ids(loaded)).toEqual(ids(src));
    // Dense format: every cell (air included) survives verbatim.
    expect(Array.from(loaded.blockData)).toEqual(Array.from(src.blockData));
  });

  it("nbt structure round-trips block placement (air restored at index 0)", async () => {
    const src = mcStructure();
    const loaded = await loadSchematicFile(asFile(writeNbtStruct(src), "b.nbt"));
    expect(loaded.format).toBe("nbt");
    expect(loaded.dimensions).toEqual(src.dimensions);
    expect(ids(loaded)).toEqual(ids(src));
    // Sparse format: air is dropped on write and refilled as the air index on load,
    // so the reconstructed grid still matches because air sits at index 0.
    expect(Array.from(loaded.blockData)).toEqual(Array.from(src.blockData));
  });

  it("prefab (Hytale) round-trips extent, per-cell blocks and anchor/origin", async () => {
    const src = hytaleStructure();
    const blob = writePrefab(src);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const loaded = await loadSchematicFile(asFile(bytes, "b.prefab.json"));

    expect(loaded.format).toBe("prefab");
    // The prefab reload rebuilds+dedups the palette, so compare block ids per cell.
    expectSameGrid(loaded, src);
    expect(loaded.metadata.anchor).toEqual({ x: 5, y: 6, z: 7 });
    expect(loaded.metadata.origin).toEqual({ x: 10, y: 20, z: 30 });
  });
});
