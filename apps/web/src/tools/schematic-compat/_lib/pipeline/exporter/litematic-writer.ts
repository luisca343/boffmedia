/**
 * Litematica schematic (`.litematic`) writer — single "main" region.
 *
 * Inverse of {@link ../loader/litematic}. We always emit one region covering the
 * whole structure (multi-region input is already merged into a single dense
 * blockData by the loader), bit-packed with the split scheme:
 *   bitsPerEntry = max(2, 32 - clz32(paletteSize − 1))
 *   entries can straddle two consecutive longs, LSB-first, YZX order.
 */
import {
  encodeNBT,
  nbtValueToTag,
  Int,
  IntArr,
  Long,
  Str,
  Compound,
  List,
  LongArr,
  type Tag,
} from "../../parsers/nbt-writer";
import { NBT_TAG } from "../../parsers/nbt";
import type { SchematicStructure, UnifiedBlock } from "../../types";

const DEFAULT_DATA_VERSION = 3700; // 1.20.4
const LITEMATIC_VERSION = 6;
// BigInt literals (1n) require ES2020; this file is compiled for an older
// target (matching the loader), so use the BigInt() constructor throughout.
const MASK64 = (BigInt(1) << BigInt(64)) - BigInt(1);

function dataVersionOf(structure: SchematicStructure): number {
  const dv = (structure.metadata as { dataVersion?: number }).dataVersion;
  return typeof dv === "number" && dv > 0 ? dv : DEFAULT_DATA_VERSION;
}

/** Bit-pack palette indices into a signed long array (split scheme). */
function encodeBlockStates(blockData: Int32Array, paletteSize: number): BigInt64Array {
  const bits = paletteSize <= 1 ? 2 : Math.max(2, 32 - Math.clz32(paletteSize - 1));
  const mask = (BigInt(1) << BigInt(bits)) - BigInt(1);
  const longCount = Math.ceil((blockData.length * bits) / 64) || 1;
  const work = new Array<bigint>(longCount).fill(BigInt(0));

  for (let i = 0; i < blockData.length; i++) {
    const val = BigInt(blockData[i]) & mask;
    const startOffset = i * bits;
    const startIdx = startOffset >> 6;
    const endIdx = ((i + 1) * bits - 1) >> 6;
    const startBit = BigInt(startOffset & 0x3f);

    work[startIdx] = (work[startIdx] | (val << startBit)) & MASK64;
    if (endIdx !== startIdx) {
      work[endIdx] = (work[endIdx] | (val >> (BigInt(64) - startBit))) & MASK64;
    }
  }

  const longs = new BigInt64Array(longCount);
  for (let i = 0; i < longCount; i++) longs[i] = BigInt.asIntN(64, work[i]);
  return longs;
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

function countNonAir(structure: SchematicStructure): number {
  const airIndices = new Set<number>();
  structure.palette.forEach((b, i) => {
    if (b.id === "minecraft:air" || b.id.endsWith(":air") || b.id === "air") airIndices.add(i);
  });
  let n = 0;
  for (let i = 0; i < structure.blockData.length; i++) {
    if (!airIndices.has(structure.blockData[i])) n++;
  }
  return n;
}

export function writeLitematic(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: length } = structure.dimensions;
  const volume = width * height * length;
  const now = BigInt(Date.now());

  const name =
    typeof structure.metadata.name === "string" ? structure.metadata.name : "Converted Schematic";
  const author =
    typeof structure.metadata.author === "string" ? structure.metadata.author : "";

  // TileEntities: each entry must have Pos: IntArray([x, y, z]) plus TE-specific data.
  // The full compound stored in te.data already contains Pos (as Int32Array) if it
  // came from a .litematic or .schem load; .nbt struct loads store only the TE
  // payload without Pos, so we inject it.
  const tileEntityTags: Tag[] = structure.tileEntities.map((te) => {
    const conv = nbtValueToTag(te.data);
    const fields =
      conv.t === NBT_TAG.Compound ? { ...conv.v } : ({} as Record<string, Tag>);
    if (!fields.Pos) fields.Pos = IntArr(Int32Array.of(te.pos.x, te.pos.y, te.pos.z));
    if (!fields.id && !fields.Id) fields.id = { t: NBT_TAG.String, v: te.id } as Tag;
    return Compound(fields);
  });

  const region: Record<string, Tag> = {
    Position: Compound({ x: Int(0), y: Int(0), z: Int(0) }),
    Size: Compound({ x: Int(width), y: Int(height), z: Int(length) }),
    BlockStatePalette: List(NBT_TAG.Compound, structure.palette.map(paletteEntry)),
    BlockStates: LongArr(encodeBlockStates(structure.blockData, structure.palette.length)),
    TileEntities: List(NBT_TAG.Compound, tileEntityTags),
    Entities: List(NBT_TAG.Compound, []),
    PendingBlockTicks: List(NBT_TAG.Compound, []),
    PendingFluidTicks: List(NBT_TAG.Compound, []),
  };

  const root: Record<string, Tag> = {
    MinecraftDataVersion: Int(dataVersionOf(structure)),
    Version: Int(LITEMATIC_VERSION),
    Metadata: Compound({
      Name: Str(name),
      Author: Str(author),
      Description: Str(""),
      EnclosingSize: Compound({ x: Int(width), y: Int(height), z: Int(length) }),
      RegionCount: Int(1),
      TimeCreated: Long(now),
      TimeModified: Long(now),
      TotalVolume: Int(volume),
      TotalBlocks: Int(countNonAir(structure)),
    }),
    Regions: Compound({ main: Compound(region) }),
  };

  return encodeNBT(root);
}
