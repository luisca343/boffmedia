/**
 * Vanilla NBT structure (`.nbt`) writer.
 *
 * Inverse of {@link ../loader/nbt-struct}. The blocks list is sparse — only
 * non-air blocks are emitted — and positions are walked in YZX order so the
 * file matches what a Structure Block would save.
 */
import {
  encodeNBT,
  nbtValueToTag,
  Int,
  Str,
  Compound,
  List,
  type Tag,
} from "../../parsers/nbt-writer";
import { NBT_TAG } from "../../parsers/nbt";
import type { SchematicStructure, UnifiedBlock } from "../../types";

const DEFAULT_DATA_VERSION = 3700; // 1.20.4

function dataVersionOf(structure: SchematicStructure): number {
  const dv = (structure.metadata as { dataVersion?: number }).dataVersion;
  return typeof dv === "number" && dv > 0 ? dv : DEFAULT_DATA_VERSION;
}

function paletteEntry(block: UnifiedBlock): Tag {
  const fields: Record<string, Tag> = { Name: Str(block.id) };
  const keys = Object.keys(block.states);
  if (keys.length > 0) {
    const props: Record<string, Tag> = {};
    for (const k of keys) props[k] = Str(block.states[k]);
    fields.Properties = Compound(props);
  }
  return Compound(fields);
}

const isAir = (id: string): boolean => id === "minecraft:air" || id === "air" || id.endsWith(":air");

export function writeNbtStruct(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: depth } = structure.dimensions;

  const airIndices = new Set<number>();
  structure.palette.forEach((b, i) => {
    if (isAir(b.id)) airIndices.add(i);
  });

  // Build a quick lookup: "x,y,z" → tile entity data for attaching nbt to block entries
  const teMap = new Map<string, Tag>();
  for (const te of structure.tileEntities) {
    const key = `${te.pos.x},${te.pos.y},${te.pos.z}`;
    teMap.set(key, nbtValueToTag(te.data));
  }

  const blocks: Tag[] = [];
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        const li = (y * depth + z) * width + x;
        const pi = structure.blockData[li];
        if (pi < 0 || pi >= structure.palette.length || airIndices.has(pi)) continue;
        const fields: Record<string, Tag> = {
          pos: List(NBT_TAG.Int, [Int(x), Int(y), Int(z)]),
          state: Int(pi),
        };
        const nbtTag = teMap.get(`${x},${y},${z}`);
        if (nbtTag) fields.nbt = nbtTag;
        blocks.push(Compound(fields));
      }
    }
  }

  const root: Record<string, Tag> = {
    DataVersion: Int(dataVersionOf(structure)),
    size: List(NBT_TAG.Int, [Int(width), Int(height), Int(depth)]),
    palette: List(NBT_TAG.Compound, structure.palette.map(paletteEntry)),
    blocks: List(NBT_TAG.Compound, blocks),
    entities: List(NBT_TAG.Compound, []),
  };

  return encodeNBT(root);
}
