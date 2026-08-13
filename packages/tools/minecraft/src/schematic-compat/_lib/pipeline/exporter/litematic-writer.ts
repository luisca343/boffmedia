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
} from "../../../../engine/parsers/nbt-writer";
import { NBT_TAG } from "../../../../engine/parsers/nbt";
import type { SchematicStructure, UnifiedBlock } from "../../../../engine/types";

const DEFAULT_DATA_VERSION = 3700; // 1.20.4
const LITEMATIC_VERSION = 6;

function dataVersionOf(structure: SchematicStructure): number {
  const dv = (structure.metadata as { dataVersion?: number }).dataVersion;
  return typeof dv === "number" && dv > 0 ? dv : DEFAULT_DATA_VERSION;
}

/**
 * Bit-pack palette indices into a signed long array (split scheme).
 *
 * The bitstream is packed LSB-first into 32-bit words (two per output long) using
 * plain number ops, then folded to `BigInt64Array` once per long. The old path
 * allocated a fresh `BigInt` for every block (mask/shift/or ≈ 5 bigints each) plus
 * an `Array<bigint>` of every long — hundreds of MB of garbage and GC churn on a
 * 500³ schematic (125M blocks). Here BigInt appears only `longCount` times.
 * `bits` ≤ 32 and the intra-word offset ≤ 31, so each entry touches at most two
 * consecutive 32-bit words — never three — which keeps the spill single-branch.
 */
function encodeBlockStates(blockData: Int32Array, paletteSize: number): BigInt64Array {
  const bits = paletteSize <= 1 ? 2 : Math.max(2, 32 - Math.clz32(paletteSize - 1));
  const n = blockData.length;
  const longCount = Math.ceil((n * bits) / 64) || 1;
  const words = new Uint32Array(longCount * 2);
  const mask = bits >= 32 ? 0xffffffff : (1 << bits) - 1;

  for (let i = 0; i < n; i++) {
    const v = (blockData[i] & mask) >>> 0;
    const bit = i * bits;
    const w = Math.floor(bit / 32);
    const off = bit - w * 32; // 0..31
    words[w] = (words[w] | (v << off)) >>> 0;
    if (off + bits > 32) {
      // off > 0 here (bits ≤ 32), so 32 - off is a valid 1..31 shift.
      words[w + 1] = (words[w + 1] | (v >>> (32 - off))) >>> 0;
    }
  }

  const longs = new BigInt64Array(longCount);
  const shift32 = BigInt(32);
  for (let i = 0; i < longCount; i++) {
    const lo = BigInt(words[i * 2]);
    const hi = BigInt(words[i * 2 + 1]);
    longs[i] = BigInt.asIntN(64, (hi << shift32) | lo);
  }
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
  // Flag lookup by palette index — a byte array beats a Set<number> across the
  // tens of millions of cells a large schematic iterates.
  const airFlags = new Uint8Array(structure.palette.length);
  structure.palette.forEach((b, i) => {
    if (b.id === "minecraft:air" || b.id.endsWith(":air") || b.id === "air") airFlags[i] = 1;
  });
  const data = structure.blockData;
  let n = 0;
  for (let i = 0; i < data.length; i++) {
    if (airFlags[data[i]] === 0) n++;
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

  const blockStates = encodeBlockStates(structure.blockData, structure.palette.length);

  const region: Record<string, Tag> = {
    Position: Compound({ x: Int(0), y: Int(0), z: Int(0) }),
    Size: Compound({ x: Int(width), y: Int(height), z: Int(length) }),
    BlockStatePalette: List(NBT_TAG.Compound, structure.palette.map(paletteEntry)),
    BlockStates: LongArr(blockStates),
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

  // Bit-packed BlockStates dominate the file; size the buffer for them up front.
  return encodeNBT(root, {
    initialCapacity: blockStates.length * 8 + structure.palette.length * 96 + 64 * 1024,
  });
}
