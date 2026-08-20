import { describe, expect, it } from "vitest";
import { loadSchematicFile } from "./index";
import { parseLevelDat } from "./level-dat";
import {
  encodeNBT,
  Compound,
  Int,
  List,
  Short,
  Str,
  ByteArr,
  IntArr,
  type Tag,
} from "../parsers/nbt-writer";
import { NBT_TAG } from "../parsers/nbt";
import { ERR, errorCode } from "../errors";

// The Sponge v2/v3 happy-path round-trips — including a v3 file whose `Blocks`
// compound must not be misread as a legacy MCEdit file — live in the exporter's
// `roundtrip.test.ts` on the tool side, next to the writers that emit those
// bytes, so this lib spec depends on nothing under `tools/`.

/** Wrap bytes in the File shape `loadSchematicFile` expects. */
function asFile(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

/**
 * A pre-1.13 MCEdit file: flat `Blocks`/`Data` byte arrays, no palette.
 * `ids`/`metas` are per-cell; `add` supplies the high id nibbles when present.
 */
function legacyBytes(
  ids: number[],
  metas?: number[],
  add?: Uint8Array,
  tileEntities?: Tag[],
): Uint8Array {
  const root: Record<string, Tag> = {
    Width: Short(ids.length),
    Height: Short(1),
    Length: Short(1),
    Materials: Str("Alpha"),
    Blocks: ByteArr(Uint8Array.from(ids.map((i) => i & 0xff))),
    Data: ByteArr(Uint8Array.from(metas ?? ids.map(() => 0))),
    ...(add ? { AddBlocks: ByteArr(add) } : {}),
    ...(tileEntities ? { TileEntities: List(NBT_TAG.Compound, tileEntities) } : {}),
  };
  return encodeNBT(root);
}

/** A Forge 1.12 `level.dat`: FML → Registries → "minecraft:blocks" → ids[{K,V}]. */
function levelDatBytes(entries: Array<[string, number]>): Uint8Array {
  return encodeNBT({
    Data: Compound({ LevelName: Str("Test World") }),
    FML: Compound({
      ModList: List(NBT_TAG.Compound, [Compound({ ModId: Str("rustic") })]),
      Registries: Compound({
        "minecraft:blocks": Compound({
          ids: List(
            NBT_TAG.Compound,
            entries.map(([k, v]) => Compound({ K: Str(k), V: Int(v) })),
          ),
        }),
      }),
    }),
  });
}

describe("legacy .schematic loading", () => {
  it("decodes a pre-1.13 MCEdit file into modern blockstates", async () => {
    const s = await loadSchematicFile(asFile(legacyBytes([1, 3]), "old.schematic"));
    expect(s.format).toBe("mcedit");
    expect(s.dimensions).toEqual({ x: 2, y: 1, z: 1 });
    expect(s.palette.map((b) => b.id)).toEqual(["minecraft:stone", "minecraft:dirt"]);
  });

  it("applies metadata as part of the id:meta lookup, not just the id", async () => {
    // 35:0 is white wool pre-flattening; 35:14 is red.
    const s = await loadSchematicFile(asFile(legacyBytes([35, 35], [0, 14]), "wool.schematic"));
    expect(s.palette.map((b) => b.id)).toEqual(["minecraft:white_wool", "minecraft:red_wool"]);
  });

  it("reads ids above 255 through the AddBlocks nibbles", async () => {
    // Two cells: id 0x101 (257) then 0x102 (258). Even index → low nibble.
    const s = await loadSchematicFile(
      asFile(legacyBytes([0x01, 0x02], [0, 0], Uint8Array.of(0x11)), "mod.schematic"),
    );
    expect(s.palette.map((b) => b.id)).toEqual(["unknown:block_257", "unknown:block_258"]);
    expect(s.metadata.unknownLegacyIds).toEqual([257, 258]);
  });

  it("rejects an unknown extension with the unsupported code", async () => {
    const err = await loadSchematicFile(asFile(new Uint8Array([0]), "thing.txt")).catch((e) => e);
    expect(errorCode(err)).toBe(ERR.schematicUnsupported);
  });
});

describe("level.dat world id table", () => {
  it("reads the Forge block registry", () => {
    const table = parseLevelDat(levelDatBytes([["rustic:granite_pillar", 2178]]));
    expect(table.source).toBe("registries");
    expect(table.worldName).toBe("Test World");
    expect(table.modCount).toBe(1);
    expect(table.ids.get(2178)).toBe("rustic:granite_pillar");
  });

  it("names a mod block that would otherwise be an unknown id", async () => {
    const table = parseLevelDat(levelDatBytes([["rustic:granite_pillar", 257]]));
    const s = await loadSchematicFile(
      asFile(legacyBytes([0x01], [0], Uint8Array.of(0x01)), "mod.schematic"),
      { worldIds: table.ids },
    );
    expect(s.palette[0].id).toBe("rustic:granite_pillar");
    expect(s.palette[0].source).toBe("mod");
    expect(s.palette[0].modId).toBe("rustic");
    expect(s.metadata.unknownLegacyIds).toEqual([]);
  });

  it("re-points a legacy LT host even when level.dat names it littletiles:blocklittletiles", async () => {
    // The host block id resolving to a real littletiles:* name must not make it
    // look "already modern": the block doesn't exist in 1.21 and the diff would
    // otherwise list it as a plain grid row.
    const table = parseLevelDat(levelDatBytes([["littletiles:blocklittletiles", 257]]));
    const te = Compound({
      id: Str("minecraft:littletilestileentity"),
      x: Int(0),
      y: Int(0),
      z: Int(0),
      content: Compound({
        tiles: List(NBT_TAG.Compound, [
          Compound({
            block: Str("minecraft:stone"),
            box: IntArr(Int32Array.of(0, 0, 0, 16, 8, 16)),
          }),
        ]),
      }),
    });
    const s = await loadSchematicFile(
      asFile(legacyBytes([0x01], [0], Uint8Array.of(0x01), [te]), "lt.schematic"),
      { worldIds: table.ids },
    );
    expect(s.palette[s.blockData[0]].id).toBe("littletiles:tiles");
    expect(s.littleTiles?.groups.length).toBeGreaterThan(0);
  });

  it("rejects a vanilla level.dat, which has no id table to read", () => {
    const bytes = encodeNBT({ Data: Compound({ LevelName: Str("Vanilla") }) });
    let code: string | undefined;
    try {
      parseLevelDat(bytes);
    } catch (err) {
      code = errorCode(err);
    }
    expect(code).toBe(ERR.levelDatNoRegistry);
  });
});
