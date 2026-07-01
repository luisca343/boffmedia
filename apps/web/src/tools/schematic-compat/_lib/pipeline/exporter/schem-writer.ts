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
} from "../../parsers/nbt-writer";
import { NBT_TAG } from "../../parsers/nbt";
import { serializeBlockState } from "../normalizer";
import type { SchematicStructure, TileEntity } from "../../types";

const DEFAULT_DATA_VERSION = 3700; // 1.20.4 — a safe modern default

function offsetOf(structure: SchematicStructure): { x: number; y: number; z: number } {
  const off = (structure.metadata as { offset?: { x: number; y: number; z: number } }).offset;
  return off ?? { x: 0, y: 0, z: 0 };
}

function dataVersionOf(structure: SchematicStructure): number {
  const dv = (structure.metadata as { dataVersion?: number }).dataVersion;
  return typeof dv === "number" && dv > 0 ? dv : DEFAULT_DATA_VERSION;
}

function paletteCompound(structure: SchematicStructure): Tag {
  const paletteTag: Record<string, Tag> = {};
  structure.palette.forEach((block, i) => {
    paletteTag[serializeBlockState(block)] = Int(i);
  });
  return Compound(paletteTag);
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

function writeSchemV2(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: length } = structure.dimensions;
  const off = offsetOf(structure);
  const root: Record<string, Tag> = {
    Version: Int(2),
    DataVersion: Int(dataVersionOf(structure)),
    Width: Short(width),
    Height: Short(height),
    Length: Short(length),
    Offset: IntArr(Int32Array.of(off.x, off.y, off.z)),
    PaletteMax: Int(structure.palette.length),
    Palette: paletteCompound(structure),
    BlockData: ByteArr(encodeVarintArray(structure.blockData)),
    BlockEntities: List(NBT_TAG.Compound, blockEntitiesV2(structure)),
    Metadata: metadataCompound(structure),
  };
  return encodeNBT(root);
}

function writeSchemV3(structure: SchematicStructure): Uint8Array {
  const { x: width, y: height, z: length } = structure.dimensions;
  const off = offsetOf(structure);
  // v3 nests block fields under `Blocks` and wraps the whole document in a
  // `Schematic` compound at the (unnamed) root.
  const blocks = Compound({
    Palette: paletteCompound(structure),
    Data: ByteArr(encodeVarintArray(structure.blockData)),
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
  return encodeNBT({ Schematic: schematic });
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
