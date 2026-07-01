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
 *
 * The longs MUST be treated as unsigned: `BigInt64Array` exposes them as signed,
 * so a long with bit 63 set reads back negative. An arithmetic right-shift of a
 * negative bigint sign-extends with 1s, which corrupts any entry that straddles
 * into that long. We reinterpret each long as unsigned (`asUintN`) before
 * shifting so only the real packed bits contribute.
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
      raw = BigInt.asUintN(64, longs[startIdx]) >> startBit;
    } else {
      // Entry straddles two longs
      raw =
        (BigInt.asUintN(64, longs[startIdx]) >> startBit) |
        (BigInt.asUintN(64, longs[endIdx]) << (BigInt(64) - startBit));
    }
    result[i] = Number(raw & maskN);
  }

  return result;
}

// ─── Region loading ───────────────────────────────────────────────────────────

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface RegionPlacement {
  region: SchematicRegion;
  /** Region min corner in the schematic's coordinate space (Position + Size). */
  min: Vec3;
}

/** Read a region's `Position` ({x,y,z} ints), defaulting to the origin. */
function readPosition(comp: NbtCompound): Vec3 {
  const pos = comp.Position;
  if (!pos || typeof pos !== "object" || Array.isArray(pos) || ArrayBuffer.isView(pos)) {
    return { x: 0, y: 0, z: 0 };
  }
  const c = pos as NbtCompound;
  const num = (v: NbtValue | undefined) =>
    typeof v === "number" ? v : typeof v === "bigint" ? Number(v) : 0;
  return { x: num(c.x), y: num(c.y), z: num(c.z) };
}

function loadRegion(name: string, comp: NbtCompound): RegionPlacement {
  const paletteList = asList(comp.BlockStatePalette, `Regions.${name}.BlockStatePalette`);
  const palette: UnifiedBlock[] = paletteList.map((entry, i) =>
    entryToBlock(asCompound(entry as NbtValue, `BlockStatePalette[${i}]`))
  );

  // Size can be negative on any axis — the sign records the selection direction.
  // Block data is stored from the region's MIN corner with positive local
  // increments, so we need |Size| for the volume and the min corner for placement.
  const sizeComp = asCompound(comp.Size, `Regions.${name}.Size`);
  const sx = asNumber(sizeComp.x, "Size.x");
  const sy = asNumber(sizeComp.y, "Size.y");
  const sz = asNumber(sizeComp.z, "Size.z");
  const absX = Math.abs(sx);
  const absY = Math.abs(sy);
  const absZ = Math.abs(sz);
  const volume = absX * absY * absZ;

  const longs = asLongArray(comp.BlockStates, `Regions.${name}.BlockStates`);
  const blockData = decodeBlockStates(longs, palette.length, volume);

  // Litematica min corner: end = pos + (size >= 0 ? size - 1 : size + 1);
  // min = componentwise min(pos, end).
  const pos = readPosition(comp);
  const endX = pos.x + (sx >= 0 ? sx - 1 : sx + 1);
  const endY = pos.y + (sy >= 0 ? sy - 1 : sy + 1);
  const endZ = pos.z + (sz >= 0 ? sz - 1 : sz + 1);
  const min = {
    x: Math.min(pos.x, endX),
    y: Math.min(pos.y, endY),
    z: Math.min(pos.z, endZ),
  };

  return {
    region: { name, dimensions: { x: absX, y: absY, z: absZ }, palette, blockData },
    min,
  };
}

// ─── Multi-region placement ─────────────────────────────────────────────────────

// Guard against a malformed Position blowing the enclosing bounds up to an
// impossible allocation.
const MAX_VOLUME = 50_000_000; // ~200 MB as Int32Array

/**
 * Compose every region into one dense grid sized to the enclosing bounding box of
 * all regions, placing each region's blocks at its `Position` offset. Regions are
 * positioned relative to the schematic origin and can sit anywhere within — or
 * apart from — one another; uncovered cells stay air.
 *
 * This replaces a naive concatenation that ignored `Position`: concatenation left
 * `blockData.length ≠ dimensions volume`, which corrupted the 3D preview (indexed
 * by enclosing coordinates) and every exporter (which iterates the dimensions).
 */
function placeRegions(placements: RegionPlacement[]): {
  palette: UnifiedBlock[];
  blockData: Int32Array;
  dimensions: Vec3;
  min: Vec3;
} {
  // Enclosing bounds from the regions themselves (don't trust EnclosingSize).
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const { region, min } of placements) {
    const { x: dx, y: dy, z: dz } = region.dimensions;
    if (dx === 0 || dy === 0 || dz === 0) continue;
    minX = Math.min(minX, min.x); minY = Math.min(minY, min.y); minZ = Math.min(minZ, min.z);
    maxX = Math.max(maxX, min.x + dx - 1);
    maxY = Math.max(maxY, min.y + dy - 1);
    maxZ = Math.max(maxZ, min.z + dz - 1);
  }
  if (!isFinite(minX)) {
    const air = parsePaletteEntry("minecraft:air");
    return {
      palette: [air],
      blockData: new Int32Array(1),
      dimensions: { x: 1, y: 1, z: 1 },
      min: { x: 0, y: 0, z: 0 },
    };
  }

  const sx = maxX - minX + 1;
  const sy = maxY - minY + 1;
  const sz = maxZ - minZ + 1;
  const volume = sx * sy * sz;
  if (volume > MAX_VOLUME) {
    throw new Error(
      `Litematic enclosing volume (${sx}×${sy}×${sz} = ${volume.toLocaleString()} blocks) ` +
        `exceeds the ${MAX_VOLUME.toLocaleString()}-block limit.`
    );
  }

  // Merged palette with air pinned to index 0 so uncovered cells read as air.
  const keyToIdx = new Map<string, number>();
  const palette: UnifiedBlock[] = [];
  const air = parsePaletteEntry("minecraft:air");
  keyToIdx.set(serializeBlockState(air), 0);
  palette.push(air);
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

  const blockData = new Int32Array(volume); // 0 = air

  for (const { region, min } of placements) {
    const { x: dx, y: dy, z: dz } = region.dimensions;
    const remap = region.palette.map(getIdx);
    const ox = min.x - minX, oy = min.y - minY, oz = min.z - minZ;
    for (let ly = 0; ly < dy; ly++) {
      for (let lz = 0; lz < dz; lz++) {
        for (let lx = 0; lx < dx; lx++) {
          const src = region.blockData[(ly * dz + lz) * dx + lx];
          if (src < 0 || src >= remap.length) continue;
          const mapped = remap[src];
          if (mapped === 0) continue; // air — leave the (already-air) cell so overlaps never erase
          const outIdx = ((ly + oy) * sz + (lz + oz)) * sx + (lx + ox);
          blockData[outIdx] = mapped;
        }
      }
    }
  }

  return { palette, blockData, dimensions: { x: sx, y: sy, z: sz }, min: { x: minX, y: minY, z: minZ } };
}

// ─── Tile entity collection ───────────────────────────────────────────────────

function collectTileEntities(
  regionsComp: NbtCompound,
  placements: RegionPlacement[],
  enclosingMin: Vec3
): TileEntity[] {
  const out: TileEntity[] = [];
  for (const { region, min } of placements) {
    const raw = regionsComp[region.name];
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || ArrayBuffer.isView(raw)) continue;
    const comp = asCompound(raw as NbtValue, `Regions.${region.name}`);
    const list = comp.TileEntities;
    if (!Array.isArray(list)) continue;
    // A region's TE Pos is local (from its min corner) — shift into enclosing space.
    const ox = min.x - enclosingMin.x;
    const oy = min.y - enclosingMin.y;
    const oz = min.z - enclosingMin.z;
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
        pos: { x: x + ox, y: y + oy, z: z + oz },
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

  const placements: RegionPlacement[] = regionNames.map((name) =>
    loadRegion(name, asCompound(regionsComp[name] as NbtValue, `Regions.${name}`))
  );

  // Single region: use its own grid directly (Position is irrelevant — nothing to
  // align against — and this avoids a full-volume copy). Multi-region: compose all
  // regions into one enclosing-box grid at their Position offsets.
  let palette: UnifiedBlock[];
  let blockData: Int32Array;
  let dimensions: Vec3;
  let enclosingMin: Vec3;
  if (placements.length === 1) {
    const p = placements[0];
    palette = p.region.palette;
    blockData = p.region.blockData;
    dimensions = p.region.dimensions;
    enclosingMin = p.min;
  } else {
    ({ palette, blockData, dimensions, min: enclosingMin } = placeRegions(placements));
  }

  return {
    format: "litematic",
    formatVersion: dataVersion,
    dimensions,
    palette,
    blockData,
    tileEntities: collectTileEntities(regionsComp, placements, enclosingMin),
    entities: [],
    regions: placements.length > 1 ? placements.map((p) => p.region) : undefined,
    metadata: {
      fileName,
      name: typeof metadata.Name === "string" ? metadata.Name : undefined,
      author: typeof metadata.Author === "string" ? metadata.Author : undefined,
      dataVersion,
      enclosingSize: { x: encX, y: encY, z: encZ },
    },
  };
}
