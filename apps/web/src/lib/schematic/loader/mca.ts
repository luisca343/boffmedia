/**
 * Minecraft Anvil region (`.mca`) loader.
 *
 * Format
 * ──────
 * Header (8 KB):
 *   0–4095   : chunk location table — 1024 × 4-byte entries
 *                [3 bytes big-endian offset in 4 KB sectors] [1 byte sector count]
 *                offset == 0 && count == 0 → chunk slot is empty
 *   4096–8191: timestamps (ignored)
 *
 * Each chunk at `offset × 4096`:
 *   [4 bytes big-endian] length (includes the compression-type byte)
 *   [1 byte]             compression type  1=gzip  2=zlib  3=none
 *   [length-1 bytes]     compressed NBT compound
 *
 * Chunk NBT layouts:
 *   1.18+  (DataVersion ≥ 2860): top-level  xPos/yPos/zPos  +  sections[]
 *   pre-1.18 (DataVersion < 2860): Level.{xPos,zPos} + Level.Sections[]
 *
 * Block-state bit-packing:
 *   1.16+  (DataVersion ≥ 2529): packed    — bitsPerEntry bits per entry, no crossing
 *   pre-1.16 (DataVersion < 2529): split   — same scheme as Litematica
 *   pre-1.13 (DataVersion < 1519): no palette at all — a `Blocks` byte array of
 *                                  numeric ids + `Data`/`Add` nibble arrays,
 *                                  translated through the legacy table.
 */

import { inflate, ungzip } from "pako";
import {
  parseNBT,
  asCompound,
  asNumber,
  asString,
  asList,
  asLongArray,
  type NbtCompound,
  type NbtValue,
} from "../parsers/nbt";
import { parsePaletteEntry, serializeBlockState } from "../normalizer";
import { loadLegacyTables, resolveLegacyBlock } from "./legacy/legacy-mapper";
import type { LegacyIdMap, SchematicStructure, UnifiedBlock, TileEntity } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DATA_VERSION_1_18 = 2860;  // sections[] at top level
const DATA_VERSION_1_16 = 2529;  // packed bit-packing
const DATA_VERSION_1_13 = 1519;  // the flattening: below this, sections carry numeric ids

// Safety cap: prevent allocating multi-GB blockData arrays for full flatworld regions
const MAX_VOLUME = 50_000_000; // ~200 MB as Int32Array

// ─── Bit-packing decoders ─────────────────────────────────────────────────────

/**
 * Packed scheme (1.16+): each long contains floor(64/bitsPerEntry) entries,
 * entries never straddle long boundaries. Longs are unsigned 64-bit values.
 */
function decodeBlockStatesPacked(
  longs: BigInt64Array,
  paletteSize: number,
  volume: number,
): Int32Array {
  const bpe = paletteSize <= 1 ? 4 : Math.max(4, 32 - Math.clz32(paletteSize - 1));
  const epl = Math.floor(64 / bpe); // entries per long
  const mask = (BigInt(1) << BigInt(bpe)) - BigInt(1);
  const result = new Int32Array(volume);
  for (let i = 0; i < volume; i++) {
    const li = Math.floor(i / epl);
    const bo = (i % epl) * bpe;
    result[i] = Number((BigInt.asUintN(64, longs[li]) >> BigInt(bo)) & mask);
  }
  return result;
}

/**
 * Split scheme (pre-1.16): identical to the Litematica decoder —
 * entries may straddle adjacent longs. Longs must be unsigned.
 */
function decodeBlockStatesSplit(
  longs: BigInt64Array,
  paletteSize: number,
  volume: number,
): Int32Array {
  const bpe = paletteSize <= 1 ? 2 : Math.max(2, 32 - Math.clz32(paletteSize - 1));
  const mask = (BigInt(1) << BigInt(bpe)) - BigInt(1);
  const result = new Int32Array(volume);
  for (let i = 0; i < volume; i++) {
    const startBit = i * bpe;
    const li = startBit >> 6;
    const endLi = ((i + 1) * bpe - 1) >> 6;
    const sb = BigInt(startBit & 0x3f);
    let raw: bigint;
    if (li === endLi) {
      raw = BigInt.asUintN(64, longs[li]) >> sb;
    } else {
      raw =
        (BigInt.asUintN(64, longs[li]) >> sb) |
        (BigInt.asUintN(64, longs[endLi]) << (BigInt(64) - sb));
    }
    result[i] = Number(raw & mask);
  }
  return result;
}

// ─── Palette helpers ──────────────────────────────────────────────────────────

function entryToBlock(entry: NbtValue): UnifiedBlock {
  const comp = asCompound(entry, "palette entry");
  const name = asString(comp.Name, "palette[].Name");
  const props = comp.Properties;
  if (
    props !== undefined &&
    typeof props === "object" &&
    !ArrayBuffer.isView(props) &&
    !Array.isArray(props)
  ) {
    const strProps: Record<string, string> = {};
    for (const [k, v] of Object.entries(props as NbtCompound)) {
      if (typeof v === "string") strProps[k] = v;
    }
    return parsePaletteEntry(name, strProps);
  }
  return parsePaletteEntry(name);
}

// ─── Section types ────────────────────────────────────────────────────────────

interface SectionData {
  /** Section Y coordinate (in section units — multiply by 16 for world Y base). */
  sectionY: number;
  palette: UnifiedBlock[];
  /** 4096 palette indices (YZX: index = (y*16+z)*16+x within section). */
  blockIndices: Int32Array;
}

// ─── Chunk parser ─────────────────────────────────────────────────────────────

function parseSectionPost118(sectionNbt: NbtValue, dataVersion: number): SectionData | null {
  const sec = asCompound(sectionNbt, "section");

  const sectionY = asNumber(sec.Y, "section.Y");

  const bsComp = sec.block_states;
  if (!bsComp || typeof bsComp !== "object" || Array.isArray(bsComp) || ArrayBuffer.isView(bsComp)) {
    return null; // biome / light-only section
  }
  const bs = asCompound(bsComp as NbtValue, "block_states");

  const paletteList = asList(bs.palette, "block_states.palette");
  if (paletteList.length === 0) return null;

  const palette = paletteList.map(entryToBlock);

  // Single-entry palette → all blocks are that type, `data` may be absent
  let blockIndices: Int32Array;
  if (palette.length === 1 || !bs.data) {
    blockIndices = new Int32Array(4096); // all index 0
  } else {
    const longs = asLongArray(bs.data, "block_states.data");
    blockIndices =
      dataVersion >= DATA_VERSION_1_16
        ? decodeBlockStatesPacked(longs, palette.length, 4096)
        : decodeBlockStatesSplit(longs, palette.length, 4096);
  }

  return { sectionY, palette, blockIndices };
}

/**
 * Context for decoding pre-flattening sections: the WorldEdit legacy table plus
 * the source world's `level.dat` id map, without which modded numeric ids have
 * no name. Null when the region is 1.13+ and needs none of it.
 */
interface LegacyContext {
  table: Record<string, string>;
  worldIds?: LegacyIdMap;
  unknownIds: Set<number>;
}

/** Nibble arrays pack two values per byte: even index → low nibble, odd → high. */
function nibble(arr: Uint8Array, i: number): number {
  const byte = arr[i >> 1] ?? 0;
  return (i & 1) === 0 ? byte & 0x0f : byte >> 4;
}

/**
 * Pre-1.13 section: `Blocks` (4096 bytes of low id bits), `Data` (nibbles of
 * metadata) and an optional `Add` nibble array carrying id bits 8–11. Each
 * distinct id:meta becomes a section-local palette entry; the caller merges
 * section palettes into the structure's global one.
 */
function parseSectionPre113(sec: NbtCompound, legacy: LegacyContext): SectionData | null {
  const blocks = sec.Blocks;
  if (!ArrayBuffer.isView(blocks)) return null;
  const blocksRaw = blocks as Uint8Array;
  const dataRaw = ArrayBuffer.isView(sec.Data) ? (sec.Data as Uint8Array) : undefined;
  const addRaw = ArrayBuffer.isView(sec.Add) ? (sec.Add as Uint8Array) : undefined;

  const sectionY = asNumber(sec.Y, "Sections[].Y");
  const palette: UnifiedBlock[] = [];
  const byKey = new Map<number, number>();
  const blockIndices = new Int32Array(4096);

  for (let i = 0; i < 4096; i++) {
    let id = blocksRaw[i] ?? 0;
    if (addRaw) id |= nibble(addRaw, i) << 8;
    const meta = dataRaw ? nibble(dataRaw, i) : 0;

    const key = (id << 4) | meta;
    let pi = byKey.get(key);
    if (pi === undefined) {
      pi = palette.length;
      palette.push(
        resolveLegacyBlock(id, meta, legacy.table, legacy.worldIds, undefined, legacy.unknownIds),
      );
      byKey.set(key, pi);
    }
    blockIndices[i] = pi;
  }

  return { sectionY, palette, blockIndices };
}

function parseSectionPre118(
  sectionNbt: NbtValue,
  dataVersion: number,
  legacy: LegacyContext | null,
): SectionData | null {
  const sec = asCompound(sectionNbt, "Sections entry");

  const sectionY = asNumber(sec.Y, "Sections[].Y");

  const paletteList = sec.Palette;
  // No palette → pre-flattening section: numeric ids, decodable only with the
  // legacy table (and, for mod blocks, the source world's id map).
  if (!paletteList) return legacy ? parseSectionPre113(sec, legacy) : null;
  const palette = asList(paletteList, "Sections[].Palette").map(entryToBlock);

  if (palette.length === 0) return null;

  const blockStates = sec.BlockStates;
  let blockIndices: Int32Array;
  if (!blockStates) {
    blockIndices = new Int32Array(4096);
  } else {
    const longs = asLongArray(blockStates, "Sections[].BlockStates");
    blockIndices =
      dataVersion >= DATA_VERSION_1_16
        ? decodeBlockStatesPacked(longs, palette.length, 4096)
        : decodeBlockStatesSplit(longs, palette.length, 4096);
  }

  return { sectionY, palette, blockIndices };
}

/** A chunk block entity with absolute world coordinates (pre-crop). */
interface RawTileEntity {
  x: number;
  y: number;
  z: number;
  id: string;
  data: Record<string, unknown>;
}

/**
 * Parse a chunk's block-entity list (1.18+ `block_entities` / pre-1.18
 * `Level.TileEntities`). Each entry carries absolute world x/y/z + id + NBT.
 */
function parseChunkTileEntities(list: NbtValue | undefined): RawTileEntity[] {
  if (!Array.isArray(list)) return [];
  const out: RawTileEntity[] = [];
  for (const te of list) {
    if (typeof te !== "object" || te === null || Array.isArray(te) || ArrayBuffer.isView(te)) continue;
    const c = te as NbtCompound;
    const id = typeof c.id === "string" ? c.id : typeof c.Id === "string" ? c.Id : null;
    if (!id) continue;
    const { x, y, z } = c;
    if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") continue;
    out.push({ x, y, z, id, data: c as Record<string, unknown> });
  }
  return out;
}

interface ParsedChunk {
  chunkX: number; // world block X = chunkX * 16
  chunkZ: number;
  sections: SectionData[];
  tileEntities: RawTileEntity[];
}

function parseChunkNbt(nbt: NbtCompound, legacy: LegacyContext | null): ParsedChunk | null {
  const dataVersion =
    nbt.DataVersion !== undefined ? asNumber(nbt.DataVersion, "DataVersion") : 0;

  if (dataVersion >= DATA_VERSION_1_18) {
    // 1.18+ top-level layout
    const chunkX = asNumber(nbt.xPos, "xPos");
    const chunkZ = asNumber(nbt.zPos, "zPos");

    const sectionsRaw = nbt.sections;
    if (!Array.isArray(sectionsRaw)) return null;

    const sections: SectionData[] = [];
    for (const s of sectionsRaw) {
      try {
        const sd = parseSectionPost118(s, dataVersion);
        if (sd) sections.push(sd);
      } catch {
        // Corrupt section — skip
      }
    }
    return { chunkX, chunkZ, sections, tileEntities: parseChunkTileEntities(nbt.block_entities) };
  } else {
    // pre-1.18: data is under Level compound
    const level = nbt.Level;
    if (!level || typeof level !== "object" || Array.isArray(level)) return null;
    const lev = asCompound(level as NbtValue, "Level");

    const chunkX = asNumber(lev.xPos, "Level.xPos");
    const chunkZ = asNumber(lev.zPos, "Level.zPos");

    const sectionsRaw = lev.Sections;
    if (!Array.isArray(sectionsRaw)) return null;

    const sections: SectionData[] = [];
    for (const s of sectionsRaw) {
      try {
        const sd = parseSectionPre118(s, dataVersion, legacy);
        if (sd) sections.push(sd);
      } catch {
        // Corrupt section — skip
      }
    }
    return { chunkX, chunkZ, sections, tileEntities: parseChunkTileEntities(lev.TileEntities) };
  }
}

// ─── Region file reader ───────────────────────────────────────────────────────

function isAir(block: UnifiedBlock): boolean {
  return block.id.endsWith(":air") || block.id === "air";
}

/** Decompressed NBT bytes of one chunk slot; null when empty, corrupt or LZ4. */
function readChunkBytes(
  data: Uint8Array,
  view: DataView,
  cx: number,
  cz: number,
): Uint8Array | null {
  const headerOff = 4 * (cz * 32 + cx);
  const sectorOffset =
    (view.getUint8(headerOff) << 16) |
    (view.getUint8(headerOff + 1) << 8) |
    view.getUint8(headerOff + 2);
  const sectorCount = view.getUint8(headerOff + 3);

  if (sectorOffset === 0 && sectorCount === 0) return null;

  const chunkStart = sectorOffset * 4096;
  if (chunkStart + 5 > data.length) return null;

  const chunkLen = view.getUint32(chunkStart, false);
  if (chunkLen < 1 || chunkStart + 4 + chunkLen > data.length) return null;

  const compressionType = data[chunkStart + 4];
  const compressed = data.subarray(chunkStart + 5, chunkStart + 4 + chunkLen);

  try {
    if (compressionType === 1) return ungzip(compressed);
    if (compressionType === 2) return inflate(compressed);
    if (compressionType === 3) return compressed;
    return null; // LZ4 / unknown
  } catch {
    return null; // corrupt compressed data
  }
}

/**
 * Decide whether this region predates the flattening, from the first readable
 * chunk's `DataVersion` — a world is written by one game version, so probing a
 * single chunk avoids holding 1024 parsed chunk trees in memory just to choose
 * a decoder. Chunks older than 1.9 carry no `DataVersion` at all, which reads
 * as 0 and is likewise legacy.
 */
async function legacyContextFor(
  data: Uint8Array,
  view: DataView,
  worldIds: LegacyIdMap | undefined,
): Promise<LegacyContext | null> {
  for (let cz = 0; cz < 32; cz++) {
    for (let cx = 0; cx < 32; cx++) {
      const raw = readChunkBytes(data, view, cx, cz);
      if (!raw) continue;
      let dataVersion = 0;
      try {
        const nbt = parseNBT(raw);
        dataVersion = nbt.DataVersion !== undefined ? asNumber(nbt.DataVersion, "DataVersion") : 0;
      } catch {
        continue; // unreadable chunk — try the next slot
      }
      if (dataVersion >= DATA_VERSION_1_13) return null;
      return { table: (await loadLegacyTables()).blocks, worldIds, unknownIds: new Set() };
    }
  }
  return null;
}

export interface McaOptions {
  /** `level.dat` id→name map of this world; only pre-1.13 regions consume it. */
  worldIds?: LegacyIdMap;
}

export async function loadMca(
  data: Uint8Array,
  fileName: string,
  options?: McaOptions,
): Promise<SchematicStructure> {
  if (data.length < 8192) {
    throw new Error("File too small to be a valid .mca region file (expected ≥ 8 KB header)");
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const legacy = await legacyContextFor(data, view, options?.worldIds);

  // ── Parse all chunks ────────────────────────────────────────────────────────

  const chunks: ParsedChunk[] = [];

  for (let cz = 0; cz < 32; cz++) {
    for (let cx = 0; cx < 32; cx++) {
      const raw = readChunkBytes(data, view, cx, cz);
      if (!raw) continue;

      try {
        const nbt = parseNBT(raw);
        const chunk = parseChunkNbt(nbt, legacy);
        if (chunk) chunks.push(chunk);
      } catch {
        // corrupt NBT — skip chunk
      }
    }
  }

  // ── Compute non-air bounding box ────────────────────────────────────────────

  let minBX = Infinity, minBY = Infinity, minBZ = Infinity;
  let maxBX = -Infinity, maxBY = -Infinity, maxBZ = -Infinity;

  for (const chunk of chunks) {
    for (const sec of chunk.sections) {
      const hasNonAir = sec.palette.some((b, i) =>
        !isAir(b) && sec.blockIndices.some((idx) => idx === i)
      );
      if (!hasNonAir) continue;

      // Rough section bounds (may include air but that's fine for bbox pass)
      const bx0 = chunk.chunkX * 16;
      const by0 = sec.sectionY * 16;
      const bz0 = chunk.chunkZ * 16;

      // Scan for actual non-air block bounds within the section
      for (let yi = 0; yi < 16; yi++) {
        for (let zi = 0; zi < 16; zi++) {
          for (let xi = 0; xi < 16; xi++) {
            const idx = (yi * 16 + zi) * 16 + xi;
            const pIdx = sec.blockIndices[idx];
            if (pIdx < 0 || pIdx >= sec.palette.length) continue;
            if (isAir(sec.palette[pIdx])) continue;
            const wx = bx0 + xi, wy = by0 + yi, wz = bz0 + zi;
            if (wx < minBX) minBX = wx; if (wx > maxBX) maxBX = wx;
            if (wy < minBY) minBY = wy; if (wy > maxBY) maxBY = wy;
            if (wz < minBZ) minBZ = wz; if (wz > maxBZ) maxBZ = wz;
          }
        }
      }
    }
  }

  if (!isFinite(minBX)) {
    // Region is entirely air / empty
    const airBlock = parsePaletteEntry("minecraft:air");
    return {
      format: "mca",
      formatVersion: 0,
      dimensions: { x: 1, y: 1, z: 1 },
      palette: [airBlock],
      blockData: new Int32Array(1),
      tileEntities: [],
      entities: [],
      metadata: { fileName, empty: true },
    };
  }

  const sx = maxBX - minBX + 1;
  const sy = maxBY - minBY + 1;
  const sz = maxBZ - minBZ + 1;
  const volume = sx * sy * sz;

  if (volume > MAX_VOLUME) {
    throw new Error(
      `Region bounding box (${sx}×${sy}×${sz} = ${volume.toLocaleString()} blocks) exceeds the ` +
        `${MAX_VOLUME.toLocaleString()}-block limit. Export a smaller sub-region from your world editor first.`
    );
  }

  // ── Build unified palette + dense blockData ─────────────────────────────────

  const keyToIdx = new Map<string, number>();
  const palette: UnifiedBlock[] = [];

  const airBlock = parsePaletteEntry("minecraft:air");
  keyToIdx.set(serializeBlockState(airBlock), 0);
  palette.push(airBlock);

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

  const blockData = new Int32Array(volume); // default 0 = air

  for (const chunk of chunks) {
    const bx0 = chunk.chunkX * 16;
    const bz0 = chunk.chunkZ * 16;

    for (const sec of chunk.sections) {
      const by0 = sec.sectionY * 16;

      for (let yi = 0; yi < 16; yi++) {
        const wy = by0 + yi;
        if (wy < minBY || wy > maxBY) continue;
        const ly = wy - minBY;

        for (let zi = 0; zi < 16; zi++) {
          const wz = bz0 + zi;
          if (wz < minBZ || wz > maxBZ) continue;
          const lz = wz - minBZ;

          for (let xi = 0; xi < 16; xi++) {
            const wx = bx0 + xi;
            if (wx < minBX || wx > maxBX) continue;

            const secIdx = (yi * 16 + zi) * 16 + xi;
            const pIdx = sec.blockIndices[secIdx];
            if (pIdx < 0 || pIdx >= sec.palette.length) continue;
            const block = sec.palette[pIdx];
            if (isAir(block)) continue;

            const lx = wx - minBX;
            const outIdx = (ly * sz + lz) * sx + lx; // YZX
            blockData[outIdx] = getIdx(block);
          }
        }
      }
    }
  }

  // ── Collect block entities inside the crop, offset to schematic-local coords ──

  const tileEntities: TileEntity[] = [];
  for (const chunk of chunks) {
    for (const te of chunk.tileEntities) {
      if (te.x < minBX || te.x > maxBX) continue;
      if (te.y < minBY || te.y > maxBY) continue;
      if (te.z < minBZ || te.z > maxBZ) continue;
      tileEntities.push({
        pos: { x: te.x - minBX, y: te.y - minBY, z: te.z - minBZ },
        id: te.id,
        data: te.data,
      });
    }
  }

  return {
    format: "mca",
    formatVersion: 0,
    dimensions: { x: sx, y: sy, z: sz },
    palette,
    blockData,
    tileEntities,
    entities: [],
    metadata: {
      fileName,
      bounds: { minX: minBX, minY: minBY, minZ: minBZ, maxX: maxBX, maxY: maxBY, maxZ: maxBZ },
      ...(legacy
        ? {
            legacy: true,
            unknownLegacyIds: [...legacy.unknownIds].sort((a, b) => a - b),
            worldIdsApplied: options?.worldIds?.size ?? 0,
          }
        : {}),
    },
  };
}
