import { describe, expect, it } from "vitest";
import { loadSchematicFile } from "./index";
import { encodeNBT, Short, Str, ByteArr, type Tag } from "../parsers/nbt-writer";
import { ERR, errorCode } from "../errors";

// The Sponge v2/v3 happy-path round-trips (incl. the regression where a v3 file's
// `Blocks` compound was misread as a legacy MCEdit file) live in the exporter's
// `roundtrip.test.ts` on the tool side, next to the writers that emit those bytes
// — so this lib spec depends on nothing under `tools/`. Here we cover only the
// detection's job: what must be REJECTED.

/** Wrap bytes in the File shape `loadSchematicFile` expects. */
function asFile(bytes: Uint8Array, name: string): File {
  return {
    name,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
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
  it("rejects a real pre-1.13 MCEdit file with the legacy code", async () => {
    const err = await loadSchematicFile(asFile(legacyBytes(), "old.schematic")).catch((e) => e);
    expect(errorCode(err)).toBe(ERR.schematicLegacy);
  });

  it("rejects an unknown extension with the unsupported code", async () => {
    const err = await loadSchematicFile(asFile(new Uint8Array([0]), "thing.txt")).catch((e) => e);
    expect(errorCode(err)).toBe(ERR.schematicUnsupported);
  });
});
