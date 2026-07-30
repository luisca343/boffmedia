/**
 * Regression cover for "Block palette size does not match expected size" —
 * WorldEdit's check that `Palette` holds exactly `PaletteMax` entries.
 *
 * The palette is keyed by blockstate STRING, so duplicate states in the source
 * palette collapse into one key. Before this was handled, `PaletteMax` reported
 * the source length while the compound held fewer keys, and every block using a
 * collapsed index referenced a palette entry that no longer existed.
 */

import { describe, expect, it } from "vitest";
import { writeSchem } from "./schem-writer";
import { parseNBT } from "@/lib/schematic/parsers/nbt";
import type { SchematicStructure, UnifiedBlock } from "@/lib/schematic/types";

function block(id: string, states: Record<string, string> = {}): UnifiedBlock {
  const [namespace, name] = id.split(":");
  return { id, namespace, name, states, tags: [], source: "vanilla" };
}

function structure(palette: UnifiedBlock[], data: number[]): SchematicStructure {
  return {
    dimensions: { x: data.length, y: 1, z: 1 },
    palette,
    blockData: Int32Array.from(data),
    tileEntities: [],
    entities: [],
    metadata: { name: "test" },
  } as unknown as SchematicStructure;
}

/** Read back the fields WorldEdit validates. */
function readBack(bytes: Uint8Array) {
  const nbt = parseNBT(bytes) as Record<string, unknown>;
  // v2 names the root compound "Schematic"; v3 nests a `Schematic` child.
  const root = (nbt.Schematic ?? nbt) as Record<string, unknown>;
  const paletteMax = root.PaletteMax as number | undefined;
  const container = (root.Blocks ?? root) as Record<string, unknown>;
  const palette = container.Palette as Record<string, number>;
  return { paletteMax, palette, entries: Object.keys(palette).length };
}

describe("schem palette", () => {
  it("PaletteMax equals the number of palette entries when states collide", () => {
    // Three source entries, two of which serialize identically — exactly what
    // pre-flattening conversion produces when several id:meta pairs map to one
    // modern state.
    const s = structure(
      [block("minecraft:stone"), block("minecraft:stone"), block("minecraft:dirt")],
      [0, 1, 2],
    );
    const { paletteMax, entries, palette } = readBack(writeSchem(s, 2));

    expect(entries).toBe(2);
    expect(paletteMax).toBe(2);
    expect(Object.keys(palette).sort()).toEqual(["minecraft:dirt", "minecraft:stone"]);
  });

  it("remaps block data onto the deduplicated indices, losing no blocks", () => {
    const s = structure(
      [block("minecraft:stone"), block("minecraft:stone"), block("minecraft:dirt")],
      [0, 1, 2],
    );
    const { palette } = readBack(writeSchem(s, 2));
    const stone = palette["minecraft:stone"];
    const dirt = palette["minecraft:dirt"];

    // Source indices 0 and 1 were the same state, so both must now read as stone
    // — previously one of them pointed at a dropped entry.
    const decoded = decodeBlockData(writeSchem(s, 2));
    expect(decoded).toEqual([stone, stone, dirt]);
  });

  it("numbers the palette densely from zero", () => {
    const s = structure(
      [
        block("minecraft:stone"),
        block("minecraft:dirt"),
        block("minecraft:stone"),
        block("minecraft:air"),
      ],
      [0, 1, 2, 3],
    );
    const { palette, entries } = readBack(writeSchem(s, 2));
    expect(Object.values(palette).sort((a, b) => a - b)).toEqual([...Array(entries).keys()]);
  });

  it("keeps distinct states distinct — dedup must not merge different blocks", () => {
    const s = structure(
      [
        block("minecraft:stone_slab", { type: "top" }),
        block("minecraft:stone_slab", { type: "bottom" }),
      ],
      [0, 1],
    );
    const { entries, paletteMax } = readBack(writeSchem(s, 2));
    expect(entries).toBe(2);
    expect(paletteMax).toBe(2);
  });

  it("applies the same dedup to v3, which has no PaletteMax to catch it", () => {
    const s = structure(
      [block("minecraft:stone"), block("minecraft:stone"), block("minecraft:dirt")],
      [0, 1, 2],
    );
    const { entries } = readBack(writeSchem(s, 3));
    expect(entries).toBe(2);
  });
});

/** Decode the varint BlockData back into palette indices. */
function decodeBlockData(bytes: Uint8Array): number[] {
  const nbt = parseNBT(bytes) as Record<string, unknown>;
  const root = (nbt.Schematic ?? nbt) as Record<string, unknown>;
  const container = (root.Blocks ?? root) as Record<string, unknown>;
  const raw = (container.BlockData ?? container.Data) as Uint8Array | Int8Array;
  const out: number[] = [];
  let value = 0;
  let shift = 0;
  for (let i = 0; i < raw.length; i++) {
    const b = raw[i] & 0xff;
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) {
      out.push(value);
      value = 0;
      shift = 0;
    } else {
      shift += 7;
    }
  }
  return out;
}
