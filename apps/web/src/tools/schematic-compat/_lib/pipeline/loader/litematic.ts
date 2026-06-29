/**
 * Litematica schematic (`.litematic`) loader.
 *
 * Format overview
 * ───────────────
 * Root NBT compound:
 *   MinecraftDataVersion: int
 *   Metadata:
 *     Name/Author/Description: string
 *     EnclosingSize: {x, y, z: int}
 *   Regions: compound keyed by region name
 *     <name>:
 *       BlockStatePalette: list[{Name: string, Properties?: compound}]
 *       BlockStates: long-array (split bit-packed, LSB-first)
 *       Size: {x, y, z: int}  (can be negative — indicates direction)
 *       Position: {x, y, z: int}
 *       TileEntities: list
 *
 * Bit-packing (split scheme — same as pre-1.16 Minecraft chunk sections):
 *   bitsPerEntry = max(2, 32 - clz32(paletteSize − 1))
 *   A palette index CAN straddle two consecutive longs.
 *   Block order: YZX — index = (y * |sz| + z) * |sx| + x
 */
import {
  parseNBT,
  asCompound,
  asNumber,
  asString,
  asList,
  asLongArray,
  type NbtCompound,
  type NbtValue,
} from "../../parsers/nbt";
import { parsePaletteEntry, serializeBlockState } from "../normalizer";
import type {
  SchematicStructure,
  SchematicRegion,
  UnifiedBlock,
  TileEntity,
} from "../../types";

// ─── Palette helpers ──────────────────────────────────────────────────────────

function entryToBlock(entry: NbtCompound): UnifiedBlock {
  const name = asString(entry.Name, "BlockStatePalette[].Name");
  const props = entry.Properties;
  if (
    props !== undefined &&
    typeof props === "object" &&
    !Array.isArray(props) &&
    !(props instanceof Uint8Array) &&
    !(props instanceof Int32Array) &&
    !(props instanceof BigInt64Array)
  ) {
    const strProps: Record<string, string> = {};
    for (const [k, v] of Object.entries(props as NbtCompound)) {
      if (typeof v === "string") strProps[k] = v;
    }
    return parsePaletteEntry(name, strProps);
  }
  return parsePaletteEntry(name);
}

// ─── Bit-packing decoder ──────────────────────────────────────────────────────

/**
 * Decode the Litematica split-scheme bit-packed long array.
 * Each entry uses bitsPerEntry bits; entries can straddle long boundaries.
 * Arithmetic right-shift is fine because the entry mask extracts only the
 * lower bitsPerEntry bits regardless of sign.
 */
function decodeBlockStates(
  longs: BigInt64Array,
  paletteSize: number,
  volume: number
): Int32Array {
  const bitsPerEntry =
    paletteSize <= 1 ? 2 : Math.max(2, 32 - Math.clz32(paletteSize - 1));
  const maskN = (BigInt(1) << BigInt(bitsPerEntry)) - BigInt(1);
  const result = new Int32Array(volume);

  for (let i = 0; i < volume; i++) {
    const startOffset = i * bitsPerEntry;
    const startIdx = startOffset >> 6; // Math.floor(startOffset / 64)
    const endIdx = ((i + 1) * bitsPerEntry - 1) >> 6;
    const startBit = BigInt(startOffset & 0x3f); // startOffset % 64

    let raw: bigint;
    if (startIdx === endIdx) {
      raw = longs[startIdx] >> startBit;
    } else {
      // Entry straddles two longs
      raw = (longs[startIdx] >> startBit) | (longs[endIdx] << (BigInt(64) - startBit));
    }
    result[i] = Number(raw & maskN);
  }

  return result;
}

// ─── Region loading ───────────────────────────────────────────────────────────

function loadRegion(name: string, comp: NbtCompound): SchematicRegion {
  const paletteList = asList(comp.BlockStatePalette, `Regions.${name}.BlockStatePalette`);
  const palette: UnifiedBlock[] = paletteList.map((entry, i) =>
    entryToBlock(asCompound(entry as NbtValue, `BlockStatePalette[${i}]`))
  );

  const sizeComp = asCompound(comp.Size, `Regions.${name}.Size`);
  const absX = Math.abs(asNumber(sizeComp.x, "Size.x"));
  const absY = Math.abs(asNumber(sizeComp.y, "Size.y"));
  const absZ = Math.abs(asNumber(sizeComp.z, "Size.z"));
  const volume = absX * absY * absZ;

  const longs = asLongArray(comp.BlockStates, `Regions.${name}.BlockStates`);
  const blockData = decodeBlockStates(longs, palette.length, volume);

  return { name, dimensions: { x: absX, y: absY, z: absZ }, palette, blockData };
}

// ─── Multi-region merge ───────────────────────────────────────────────────────

function mergeRegions(regions: SchematicRegion[]): {
  palette: UnifiedBlock[];
  blockData: Int32Array;
} {
  // Deduplicate by full blockstate string (includes states)
  const keyToIdx = new Map<string, number>();
  const palette: UnifiedBlock[] = [];

  const getIdx = (block: UnifiedBlock): number => {
    const key = serializeBlockState(block);
    let idx = keyToIdx.get(key);
    if (idx === undefined) {
      idx = palette.length;
      keyToIdx.set(key, idx);
      palette.push(block);
    }
    return idx;
  };

  const totalSize = regions.reduce((s, r) => s + r.blockData.length, 0);
  const blockData = new Int32Array(totalSize);
  let offset = 0;

  for (const region of regions) {
    const remap = region.palette.map(getIdx);
    for (let i = 0; i < region.blockData.length; i++) {
      blockData[offset + i] = remap[region.blockData[i]];
    }
    offset += region.blockData.length;
  }

  return { palette, blockData };
}

// ─── Tile entity collection ───────────────────────────────────────────────────

function collectTileEntities(regionsComp: NbtCompound): TileEntity[] {
  const out: TileEntity[] = [];
  for (const [regName, rawRegion] of Object.entries(regionsComp)) {
    const comp = asCompound(rawRegion as NbtValue, `Regions.${regName}`);
    const list = comp.TileEntities;
    if (!Array.isArray(list)) continue;
    for (const te of list) {
      if (typeof te !== "object" || te === null || Array.isArray(te)) continue;
      const teComp = te as NbtCompound;
      const pos = teComp.Pos;
      let x = 0,
        y = 0,
        z = 0;
      if (pos instanceof Int32Array && pos.length >= 3) {
        x = pos[0]; y = pos[1]; z = pos[2];
      }
      out.push({
        pos: { x, y, z },
        id: typeof teComp.Id === "string" ? teComp.Id : "unknown",
        data: teComp as Record<string, unknown>,
      });
    }
  }
  return out;
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function loadLitematic(data: Uint8Array, fileName: string): SchematicStructure {
  const root = parseNBT(data);

  const dataVersion =
    root.MinecraftDataVersion !== undefined
      ? asNumber(root.MinecraftDataVersion, "MinecraftDataVersion")
      : 0;

  const metadata = asCompound(root.Metadata, "Metadata");

  const enclosingComp = asCompound(metadata.EnclosingSize, "Metadata.EnclosingSize");
  const encX = Math.abs(asNumber(enclosingComp.x, "EnclosingSize.x"));
  const encY = Math.abs(asNumber(enclosingComp.y, "EnclosingSize.y"));
  const encZ = Math.abs(asNumber(enclosingComp.z, "EnclosingSize.z"));

  const regionsComp = asCompound(root.Regions, "Regions");
  const regionNames = Object.keys(regionsComp);
  if (regionNames.length === 0) {
    throw new Error("Litematic has no regions");
  }

  const regions: SchematicRegion[] = regionNames.map((name) =>
    loadRegion(name, asCompound(regionsComp[name] as NbtValue, `Regions.${name}`))
  );

  const { palette, blockData } =
    regions.length === 1
      ? { palette: regions[0].palette, blockData: regions[0].blockData }
      : mergeRegions(regions);

  return {
    format: "litematic",
    formatVersion: dataVersion,
    dimensions: { x: encX, y: encY, z: encZ },
    palette,
    blockData,
    tileEntities: collectTileEntities(regionsComp),
    entities: [],
    regions: regions.length > 1 ? regions : undefined,
    metadata: {
      fileName,
      name: typeof metadata.Name === "string" ? metadata.Name : undefined,
      author: typeof metadata.Author === "string" ? metadata.Author : undefined,
      dataVersion,
    },
  };
}
