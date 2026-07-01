/**
 * WorldEdit Sponge Schematic (`.schem`) loader — v2 and v3.
 *
 * v2: block fields live at the root compound.
 * v3: block fields are nested under a `Blocks` compound (with `Palette` /
 *     `Data` keys instead of `Palette` / `BlockData`). We support both.
 *
 * BlockData is a varint stream of palette indices in YZX order:
 *   index = (y * Length + z) * Width + x
 */
import {
  parseNBT,
  asCompound,
  asNumber,
  asByteArray,
  decodeVarintArray,
  type NbtCompound,
  type NbtValue,
} from "../../parsers/nbt";
import { parseBlockState } from "../normalizer";
import type { SchematicStructure, UnifiedBlock, TileEntity } from "../../types";

/**
 * Width/Height/Length are NBT `short` in the Sponge spec but interpreted unsigned
 * (WorldEdit/FAWE), so a dimension in 32768–65535 round-trips through a signed
 * short as a negative value. Recover the unsigned 16-bit magnitude. A foreign
 * exporter that stored them as `int` stays positive and is untouched.
 */
function readDimension(v: NbtValue | undefined, ctx: string): number {
  const n = asNumber(v, ctx);
  return n < 0 ? n + 0x10000 : n;
}

function buildPalette(paletteTag: NbtCompound): UnifiedBlock[] {
  const entries = Object.entries(paletteTag);
  const palette: UnifiedBlock[] = new Array(entries.length);
  for (const [stateStr, index] of entries) {
    const idx = asNumber(index, `Palette["${stateStr}"]`);
    palette[idx] = parseBlockState(stateStr);
  }
  // Guard against gaps from a malformed palette.
  for (let i = 0; i < palette.length; i++) {
    if (!palette[i]) palette[i] = parseBlockState("minecraft:air");
  }
  return palette;
}

function readTileEntities(root: NbtCompound, container: NbtCompound): TileEntity[] {
  const list = (container.BlockEntities ?? root.BlockEntities ?? root.TileEntities) as
    | unknown
    | undefined;
  if (!Array.isArray(list)) return [];
  const out: TileEntity[] = [];
  for (const raw of list) {
    if (typeof raw !== "object" || raw === null) continue;
    const comp = raw as NbtCompound;
    const pos = comp.Pos;
    let x = 0;
    let y = 0;
    let z = 0;
    if (pos instanceof Int32Array && pos.length >= 3) {
      x = pos[0];
      y = pos[1];
      z = pos[2];
    }
    // v3 nests the block-entity NBT under a `Data` compound; v2 keeps it inline.
    // Flatten v3's `Data` up so downstream (diff, writers) sees one shape.
    const data: Record<string, unknown> = { ...(comp as Record<string, unknown>) };
    if (data.Data && typeof data.Data === "object" && !ArrayBuffer.isView(data.Data)) {
      Object.assign(data, data.Data as Record<string, unknown>);
      delete data.Data;
    }
    out.push({
      pos: { x, y, z },
      id: typeof comp.Id === "string" ? comp.Id : typeof comp.id === "string" ? comp.id : "unknown",
      data,
    });
  }
  return out;
}

export function loadSchem(data: Uint8Array, fileName: string): SchematicStructure {
  const root = parseNBT(data);

  // Some exporters wrap everything in a "Schematic" compound.
  const schem = (root.Schematic ? asCompound(root.Schematic, "Schematic") : root) as NbtCompound;

  const version = schem.Version !== undefined ? asNumber(schem.Version, "Version") : 2;

  const width = readDimension(schem.Width, "Width");
  const height = readDimension(schem.Height, "Height");
  const length = readDimension(schem.Length, "Length");

  // v3 nests blocks under a "Blocks" compound; v2 keeps them at the root.
  const blockContainer =
    version >= 3 && schem.Blocks ? asCompound(schem.Blocks, "Blocks") : schem;

  const paletteTag = asCompound(
    blockContainer.Palette ?? schem.Palette,
    "Palette"
  );
  const palette = buildPalette(paletteTag);

  const blockDataRaw = asByteArray(
    blockContainer.BlockData ?? blockContainer.Data ?? schem.BlockData,
    "BlockData"
  );
  const expected = width * height * length;
  const blockData = decodeVarintArray(blockDataRaw, expected);

  const tileEntities = readTileEntities(root, blockContainer);

  let offsetX = 0;
  let offsetY = 0;
  let offsetZ = 0;
  if (schem.Offset instanceof Int32Array && schem.Offset.length >= 3) {
    offsetX = schem.Offset[0];
    offsetY = schem.Offset[1];
    offsetZ = schem.Offset[2];
  }

  return {
    format: "schem",
    formatVersion: version,
    dimensions: { x: width, y: height, z: length },
    palette,
    blockData,
    tileEntities,
    entities: [],
    metadata: {
      fileName,
      dataVersion: schem.DataVersion !== undefined ? asNumber(schem.DataVersion, "DataVersion") : undefined,
      offset: { x: offsetX, y: offsetY, z: offsetZ },
    },
  };
}
