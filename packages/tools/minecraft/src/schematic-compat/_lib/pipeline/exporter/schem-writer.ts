/**
 * WorldEdit Sponge Schematic (`.schem`) writer — v2 and v3.
 *
 * v2 keeps the block fields at the root compound:
 *   Width/Height/Length: short      dimensions
 *   Offset:              int-array  [x, y, z]
 *   Palette:             compound   blockstate string -> int index
 *   BlockData:           byte-array varint palette indices, YZX order
 *   BlockEntities:       list       each TE compound carries Id + Pos inline
 *
 * v3 (Sponge spec) wraps everything in a `Schematic` compound and nests the
 * block fields under a `Blocks` container with `Palette` / `Data` keys, and each
 * block entity splits into `Id` / `Pos` / `Data` (the remaining NBT). v2 is the
 * most broadly supported variant (WorldEdit, FAWE, Litematica all read it) so it
 * stays the default; v3 is offered for tools that expect the current spec.
 *
 * Inverse of {@link ../loader/schem}.
 */
import {
  encodeNBT,
  encodeVarintArray,
  nbtValueToTag,
  Short,
  Int,
  Str,
  ByteArr,
  IntArr,
  Compound,
  List,
  type Tag,
} from "../../../../engine/parsers/nbt-writer";
import { NBT_TAG } from "../../../../engine/parsers/nbt";
import { serializeBlockState } from "../../../../engine/normalizer";
import type { SchematicStructure, TileEntity } from "../../../../engine/types";

const DEFAULT_DATA_VERSION = 3700; // 1.20.4 — a safe modern default

function offsetOf(structure: SchematicStructure): { x: number; y: number; z: number } {
  const off = (structure.metadata as { offset?: { x: number; y: number; z: number } }).offset;
  return off ?? { x: 0, y: 0, z: 0 };
}

function dataVersionOf(structure: SchematicStructure): number {
  const dv = (structure.metadata as { dataVersion?: number }).dataVersion;
  return typeof dv === "number" && dv > 0 ? dv : DEFAULT_DATA_VERSION;
}

/**
 * The palette as the format needs it: one entry per distinct blockstate string,
 * numbered densely from 0, with `blockData` remapped onto the new numbering.
 *
 * The format's palette is an NBT *compound keyed by the blockstate string*, so
 * two palette entries that serialize identically are the same key. Conversion
 * produces such pairs routinely — several pre-flattening `id:meta` combinations
 * collapse onto one modern state — and writing them straight out silently kept
 * only the last one's index. Everything referencing the earlier index then
 * pointed at a palette entry that no longer existed: WorldEdit rejects the file
 * outright ("Block palette size does not match expected size", its check that
 * `Palette` has exactly `PaletteMax` entries), and a reader that tolerated the
 * count would still have lost those blocks.
 *
 * Deduplicating here rather than upstream keeps the structure's palette indices
 * stable for everything else (block entities, the viewer, the diff) — this is a
 * concern of the file format, not of the model.
 */
function canonicalPalette(structure: SchematicStructure): {
  palette: Tag;
  blockData: Int32Array;
  size: number;
} {
  const indexOfState = new Map<string, number>();
  const remap = new Int32Array(structure.palette.length);
  const paletteTag: Record<string, Tag> = {};

  structure.palette.forEach((block, i) => {
    const state = serializeBlockState(block);
    let index = indexOfState.get(state);
    if (index === undefined) {
      index = indexOfState.size;
      indexOfState.set(state, index);
      paletteTag[state] = Int(index);
    }
    remap[i] = index;
  });

  const src = structure.blockData;
  const blockData = new Int32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const old = src[i];
    // An out-of-range index would otherwise become a silent 0 (usually air); the
    // palette is built from the same structure, so this only guards corruption.
    blockData[i] = old >= 0 && old < remap.length ? remap[old] : 0;
  }

  return { palette: Compound(paletteTag), blockData, size: indexOfState.size };
}

/** The TE's NBT compound minus Id/Pos (those are carried by dedicated keys). */
function tileEntityDataFields(te: TileEntity): Record<string, Tag> {
  const comp = nbtValueToTag(te.data);
  if (comp.t !== NBT_TAG.Compound) return {};
  const { Id: _id, id: _id2, Pos: _pos, ...rest } = comp.v;
  return rest;
}

/** v2 block entities: Id + Pos live inline alongside the data fields. */
function blockEntitiesV2(structure: SchematicStructure): Tag[] {
  return structure.tileEntities.map((te) =>
    Compound({
      ...tileEntityDataFields(te),
      Id: Str(te.id),
      Pos: IntArr(Int32Array.of(te.pos.x, te.pos.y, te.pos.z)),
    }),
  );
}

/** v3 block entities: Id + Pos at the top level, remaining NBT under `Data`. */
function blockEntitiesV3(structure: SchematicStructure): Tag[] {
  return structure.tileEntities.map((te) => {
    const fields: Record<string, Tag> = {
      Id: Str(te.id),
      Pos: IntArr(Int32Array.of(te.pos.x, te.pos.y, te.pos.z)),
    };
    const data = tileEntityDataFields(te);
    if (Object.keys(data).length > 0) fields.Data = Compound(data);
    return Compound(fields);
  });
}

function metadataCompound(structure: SchematicStructure): Tag {
  return Compound({
    Name: Str(
      typeof structure.metadata.name === "string" ? structure.metadata.name : "Converted Schematic",
    ),
  });
}

/** Rough NBT buffer size so a large export sizes its buffer once: block bytes
 *  dominate; palette strings + entities add a bounded per-entry margin. */
function capacityHint(structure: SchematicStructure, blockBytes: Uint8Array): number {
  return blockBytes.length + structure.palette.length * 96 + 64 * 1024;
}

function writeSchemV2(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: length } = structure.dimensions;
  const off = offsetOf(structure);
  const { palette, blockData, size } = canonicalPalette(structure);
  const blockBytes = encodeVarintArray(blockData);
  const root: Record<string, Tag> = {
    Version: Int(2),
    DataVersion: Int(dataVersionOf(structure)),
    Width: Short(width),
    Height: Short(height),
    Length: Short(length),
    Offset: IntArr(Int32Array.of(off.x, off.y, off.z)),
    // Must equal the number of Palette entries, not the source palette's length.
    PaletteMax: Int(size),
    Palette: palette,
    BlockData: ByteArr(blockBytes),
    BlockEntities: List(NBT_TAG.Compound, blockEntitiesV2(structure)),
    Metadata: metadataCompound(structure),
  };
  // The v2 spec names the ROOT compound "Schematic" (v3 instead nests an
  // unnamed root's child). WorldEdit's format detection checks that name; an
  // unnamed root makes it fall through to the v3 reader, which then dies on
  // the missing `Schematic` child.
  return encodeNBT(root, {
    rootName: "Schematic",
    initialCapacity: capacityHint(structure, blockBytes),
  });
}

function writeSchemV3(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: length } = structure.dimensions;
  const off = offsetOf(structure);
  // v3 nests block fields under `Blocks` and wraps the whole document in a
  // `Schematic` compound at the (unnamed) root. v3 has no PaletteMax, but the
  // duplicate-state collapse would lose blocks here just the same.
  const { palette, blockData } = canonicalPalette(structure);
  const blockBytes = encodeVarintArray(blockData);
  const blocks = Compound({
    Palette: palette,
    Data: ByteArr(blockBytes),
    BlockEntities: List(NBT_TAG.Compound, blockEntitiesV3(structure)),
  });
  const schematic = Compound({
    Version: Int(3),
    DataVersion: Int(dataVersionOf(structure)),
    Width: Short(width),
    Height: Short(height),
    Length: Short(length),
    Offset: IntArr(Int32Array.of(off.x, off.y, off.z)),
    Blocks: blocks,
    Metadata: metadataCompound(structure),
  });
  return encodeNBT({ Schematic: schematic }, { initialCapacity: capacityHint(structure, blockBytes) });
}

export function writeSchem(structure: SchematicStructure, version: 2 | 3 = 2): Uint8Array {
  // Width/Height/Length are 16-bit (unsigned short) in the Sponge format; anything
  // larger cannot be represented — fail loudly instead of writing a corrupt file.
  const { x, y, z } = structure.dimensions;
  if (x > 0xffff || y > 0xffff || z > 0xffff) {
    throw new Error(
      `.schem dimensions (${x}×${y}×${z}) exceed the format's 65535 per-axis limit. ` +
        `Export a smaller region.`,
    );
  }
  return version === 3 ? writeSchemV3(structure) : writeSchemV2(structure);
}
