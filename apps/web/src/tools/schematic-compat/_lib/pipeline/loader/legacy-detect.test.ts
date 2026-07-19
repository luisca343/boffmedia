import { describe, expect, it } from "vitest";
import { loadSchematicFile } from "./index";
import { writeSchem } from "../exporter/schem-writer";
import { encodeNBT, Short, Int, Str, ByteArr, Compound, type Tag } from "../../parsers/nbt-writer";
import { parseBlockState } from "../normalizer";
import { ERR, errorCode } from "../../errors";
import type { SchematicStructure } from "../../types";

/** Wrap bytes in the File shape `loadSchematicFile` expects. */
function asFile(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

function structure(): SchematicStructure {
  return {
    format: "schem",
    formatVersion: 2,
    dimensions: { x: 2, y: 1, z: 1 },
    palette: [parseBlockState("minecraft:stone"), parseBlockState("minecraft:dirt")],
    blockData: Int32Array.of(0, 1),
    tileEntities: [],
    entities: [],
    metadata: {},
  };
}

/** A pre-1.13 MCEdit file: flat `Blocks`/`Data` byte arrays, no palette. */
function legacyBytes(): Uint8Array {
  const root: Record<string, Tag> = {
    Width: Short(2),
    Height: Short(1),
    Length: Short(1),
    Materials: Str("Alpha"),
    Blocks: ByteArr(Uint8Array.of(1, 3)),
    Data: ByteArr(Uint8Array.of(0, 0)),
  };
  return encodeNBT(root);
}

describe("legacy .schematic detection", () => {
  it("loads a Sponge v2 file", async () => {
    const s = await loadSchematicFile(asFile(writeSchem(structure(), 2), "build.schem"));
    expect(s.dimensions).toEqual({ x: 2, y: 1, z: 1 });
    expect(s.palette.map((b) => b.id)).toContain("minecraft:stone");
  });

  it("loads a Sponge v3 file, whose `Blocks` compound nests the palette", async () => {
    // The regression: v3 has a `Blocks` key too, so a presence-only check read
    // every modern WorldEdit export as a legacy MCEdit file.
    const s = await loadSchematicFile(asFile(writeSchem(structure(), 3), "build.schem"));
    expect(s.formatVersion).toBe(3);
    expect(s.dimensions).toEqual({ x: 2, y: 1, z: 1 });
    expect(s.palette.map((b) => b.id)).toContain("minecraft:stone");
  });

  it("rejects a real pre-1.13 MCEdit file with the legacy code", async () => {
    const err = await loadSchematicFile(asFile(legacyBytes(), "old.schematic")).catch((e) => e);
    expect(errorCode(err)).toBe(ERR.schematicLegacy);
  });

  it("rejects an unknown extension with the unsupported code", async () => {
    const err = await loadSchematicFile(asFile(new Uint8Array([0]), "thing.txt")).catch((e) => e);
    expect(errorCode(err)).toBe(ERR.schematicUnsupported);
  });
});
