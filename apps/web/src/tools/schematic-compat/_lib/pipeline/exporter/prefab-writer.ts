import type { SchematicStructure, UnifiedBlock } from "@/lib/schematic/types";
import { ZipWriter } from "@/lib/schematic/parsers/zip-writer";
import { isHytaleFluidName } from "@/lib/schematic/fluids";
import { fluidPlacement, type FluidPlacement } from "../fluid";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function vec3(v: unknown, fallback: Vec3): Vec3 {
  const o = (v ?? {}) as Partial<Vec3>;
  return {
    x: typeof o.x === "number" ? o.x : fallback.x,
    y: typeof o.y === "number" ? o.y : fallback.y,
    z: typeof o.z === "number" ? o.z : fallback.z,
  };
}

/** Reconstruct the raw prefab block name from a normalized {@link UnifiedBlock}. */
function blockName(block: UnifiedBlock): string {
  // Hytale blocks carry the catalog name in `.name`; foreign (unmapped) blocks
  // keep their full id so the diff can still flag them to the user.
  const base = block.namespace === "hytale" ? block.name : block.id;
  const state = block.states.state;
  return state ? `*${base}_State_Definitions_${state}` : base;
}

function intState(block: UnifiedBlock, key: string): number | undefined {
  const v = block.states[key];
  if (v === undefined) return undefined;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * A Hytale block-entity payload is wrapped in a top-level `Components` object
 * (containers, beds, placed-by, …). Foreign tile-entity data — e.g. a Minecraft
 * barrel's `{ id: "minecraft:barrel", Items, … }` carried through a cross-game
 * conversion — has no such wrapper; writing it into a `.prefab.json` produces a
 * component Hytale can't parse, so it's dropped on export.
 */
function isHytaleComponent(comp: Record<string, unknown>): boolean {
  return typeof comp.Components === "object" && comp.Components !== null;
}

// A Hytale prefab is an uncompressed per-block list, so its size scales with the
// non-air block count. Beyond this many blocks a single file won't open in Hytale
// (it parses the whole document into memory before placing anything — verified in
// hytale-shared-source BsonPrefabBufferDeserializer / SelectionPrefabSerializer),
// so the build is split into parts of at most this size, packaged as one .zip.
// Doubles as the per-part budget. Tunable.
const MAX_BLOCKS_PER_PREFAB = 2_000_000;

// Loose runaway sanity cap on the iteration sweep (output scales with real block
// count, not volume, and streams out); blockData can't be much larger anyway.
const MAX_PREFAB_CELLS = 2_000_000_000;

// Flush the single-file text buffer to a browser-managed Blob chunk at this many
// UTF-16 chars — chunks move to blob storage (disk-spillable) and the string is
// released, keeping peak heap ~one chunk.
const PREFAB_CHUNK_CHARS = 4 * 1024 * 1024;

interface PrefabHeader {
  version: number;
  blockIdVersion: number;
  anchor: Vec3;
  origin: Vec3;
}

function prefabHeader(structure: SchematicStructure): PrefabHeader {
  const meta = structure.metadata ?? {};
  return {
    // Keep the prefab version when round-tripping a prefab; otherwise emit the
    // current Hytale version (a converted Minecraft schematic carries an unrelated
    // format version that must not leak into the .prefab.json).
    version: structure.format === "prefab" && structure.formatVersion ? structure.formatVersion : 8,
    blockIdVersion: typeof meta.blockIdVersion === "number" ? meta.blockIdVersion : 11,
    anchor: vec3(meta.anchor, { x: 0, y: 0, z: 0 }),
    origin: vec3(meta.origin, { x: 0, y: 0, z: 0 }),
  };
}

function componentsByLocalPos(structure: SchematicStructure): Map<string, Record<string, unknown>> {
  const m = new Map<string, Record<string, unknown>>();
  for (const te of structure.tileEntities) m.set(`${te.pos.x},${te.pos.y},${te.pos.z}`, te.data);
  return m;
}

/** The document header up to (and including) the opening `"blocks":[`. */
function docPrefix(h: PrefabHeader): string {
  return (
    `{"version":${h.version},"blockIdVersion":${h.blockIdVersion},` +
    `"anchorX":${h.anchor.x},"anchorY":${h.anchor.y},"anchorZ":${h.anchor.z},"blocks":[`
  );
}

/** One block's compact JSON object, matching Hytale's field set + defaults. */
function blockJson(
  block: UnifiedBlock,
  x: number,
  y: number,
  z: number,
  comp: Record<string, unknown> | undefined,
): string {
  let s = `{"x":${x},"y":${y},"z":${z},"name":${JSON.stringify(blockName(block))}`;
  const rotation = intState(block, "rotation");
  if (rotation !== undefined && rotation !== 0) s += `,"rotation":${rotation}`;
  const support = intState(block, "support");
  if (support !== undefined) s += `,"support":${support}`;
  const filler = intState(block, "filler");
  if (filler !== undefined) s += `,"filler":${filler}`;
  if (comp && isHytaleComponent(comp)) s += `,"components":${JSON.stringify(comp)}`;
  return s + "}";
}

/** One fluid's compact JSON object for the top-level `fluids` array. */
function fluidJson(p: FluidPlacement, x: number, y: number, z: number): string {
  return `{"x":${x},"y":${y},"z":${z},"name":${JSON.stringify(p.name)},"level":${p.level}}`;
}

/** Count renderable (non-air) blocks — decides single-file vs tiled export. */
function countNonAir(structure: SchematicStructure): number {
  const airFlags = new Uint8Array(structure.palette.length);
  structure.palette.forEach((b, i) => {
    if (b.name === "air" || b.id === "air" || b.id.endsWith(":air")) airFlags[i] = 1;
  });
  const data = structure.blockData;
  let n = 0;
  for (let i = 0; i < data.length; i++) if (airFlags[data[i]] === 0) n++;
  return n;
}

/**
 * Single-file **sparse** prefab — only non-air blocks, ordered x→z→y, exactly what
 * Hytale itself writes (`BlockSelection` stores blocks in a sparse position map and
 * `SelectionPrefabSerializer.serialize` emits only present blocks, never air; its
 * `deserialize` re-adds each listed block and leaves the rest empty). Air carries
 * no meaning in Hytale (absent cell = empty), and the anchor + absolute coords
 * preserve placement. Streams to disk-backed {@link Blob} chunks; minified.
 *
 * Fluids are emitted separately: they are excluded from `blocks` and written into
 * the top-level `fluids` array Hytale expects (a fluid in `blocks` becomes a solid
 * static block — see {@link fluidPlacement}). Both passes sweep the grid in the
 * same order and stream, so peak heap stays ~one chunk.
 */
function writeSinglePrefab(structure: SchematicStructure, h: PrefabHeader): Blob {
  const { x: sx, y: sy, z: sz } = structure.dimensions;
  const components = componentsByLocalPos(structure);
  const palette = structure.palette;
  const data = structure.blockData;
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];

  let buf = docPrefix(h);
  const flush = () => {
    parts.push(new Blob([encoder.encode(buf)]));
    buf = "";
  };

  // Pass 1 — solid blocks (air and fluids excluded).
  let first = true;
  for (let xi = 0; xi < sx; xi++) {
    for (let zi = 0; zi < sz; zi++) {
      for (let yi = 0; yi < sy; yi++) {
        const pi = data[(yi * sz + zi) * sx + xi];
        const block = pi >= 0 && pi < palette.length ? palette[pi] : undefined;
        if (!block || block.name === "air" || isHytaleFluidName(block.name)) continue;
        buf +=
          (first ? "" : ",") +
          blockJson(block, xi + h.origin.x, yi + h.origin.y, zi + h.origin.z, components.get(`${xi},${yi},${zi}`));
        first = false;
        if (buf.length >= PREFAB_CHUNK_CHARS) flush();
      }
    }
  }

  // Pass 2 — fluids into their own array, keyed on the block's fluid states. Only
  // emitted when the palette actually holds a fluid, so a fluid-free prefab keeps
  // its exact prior shape (no empty `fluids` array).
  if (palette.some((b) => isHytaleFluidName(b.name))) {
    buf += `],"fluids":[`;
    let firstFluid = true;
    for (let xi = 0; xi < sx; xi++) {
      for (let zi = 0; zi < sz; zi++) {
        for (let yi = 0; yi < sy; yi++) {
          const pi = data[(yi * sz + zi) * sx + xi];
          const block = pi >= 0 && pi < palette.length ? palette[pi] : undefined;
          if (!block) continue;
          const placement = fluidPlacement(block.name, block.states);
          if (!placement) continue;
          buf += (firstFluid ? "" : ",") + fluidJson(placement, xi + h.origin.x, yi + h.origin.y, zi + h.origin.z);
          firstFluid = false;
          if (buf.length >= PREFAB_CHUNK_CHARS) flush();
        }
      }
    }
  }

  buf += "]}";
  flush();
  return new Blob(parts, { type: "application/json" });
}

function partsReadme(parts: number, h: PrefabHeader): string {
  return [
    `This build was too large for a single Hytale prefab, so it was split into ${parts} part prefab(s).`,
    ``,
    `Each part is a standalone .prefab.json holding a slice of the build's blocks. Every part`,
    `keeps its blocks' ORIGINAL coordinates and shares the same anchor`,
    `(${h.anchor.x}, ${h.anchor.y}, ${h.anchor.z}), so the split is only about file size — it`,
    `carries no spatial meaning.`,
    ``,
    `To reassemble the whole build in Hytale, place EVERY part at the SAME position/anchor —`,
    `the baked-in coordinates drop each block back into its correct place, and the parts overlap`,
    `to form the complete build.`,
    ``,
    `Note: a multi-prefab "load folder" lays prefabs out in a row instead of overlapping them,`,
    `so place the parts individually at one origin to reconstruct. Files are named part_NNN.prefab.json.`,
  ].join("\n");
}

/**
 * Split path — the build's blocks partitioned into ≤{@link MAX_BLOCKS_PER_PREFAB}-block
 * "part" prefabs packaged into one `.zip`, used when a single prefab would be too big
 * for Hytale to load. Partitioning is purely by count (not spatially): every part
 * shares the anchor and keeps absolute coordinates, so placing them all at one point
 * reconstructs the build regardless of how blocks are divided among files — which
 * yields the fewest files. Each part is built, encoded and handed to the zip one at a
 * time, so only a single part is ever resident.
 */
function writePrefabParts(structure: SchematicStructure, h: PrefabHeader): Blob {
  const { x: sx, y: sy, z: sz } = structure.dimensions;
  const components = componentsByLocalPos(structure);
  const palette = structure.palette;
  const data = structure.blockData;
  const encoder = new TextEncoder();
  const zip = new ZipWriter();
  const prefix = docPrefix(h);

  let buf = prefix;
  let fluidBuf = ""; // fluids for the current part, held until it closes
  let inPart = 0; // non-air entries (blocks + fluids) written into the current part
  let parts = 0;
  let firstBlock = true;
  let firstFluid = true;

  const closePart = () => {
    buf += fluidBuf ? `],"fluids":[${fluidBuf}]}` : "]}";
    parts++;
    zip.add(`part_${String(parts).padStart(3, "0")}.prefab.json`, encoder.encode(buf));
    buf = prefix;
    fluidBuf = "";
    inPart = 0;
    firstBlock = true;
    firstFluid = true;
  };

  // Sweep x→z→y (Hytale's block order); fill each part to the budget, then roll
  // over. Fluids go to the current part's `fluids` array (same cell order, so
  // each fluid lands in exactly one part) and count toward the budget alongside
  // blocks, keeping the buffered-in-memory fluid slice bounded.
  for (let xi = 0; xi < sx; xi++) {
    for (let zi = 0; zi < sz; zi++) {
      for (let yi = 0; yi < sy; yi++) {
        const pi = data[(yi * sz + zi) * sx + xi];
        const block = pi >= 0 && pi < palette.length ? palette[pi] : undefined;
        if (!block || block.name === "air") continue;
        const placement = fluidPlacement(block.name, block.states);
        if (placement) {
          fluidBuf += (firstFluid ? "" : ",") + fluidJson(placement, xi + h.origin.x, yi + h.origin.y, zi + h.origin.z);
          firstFluid = false;
        } else {
          buf +=
            (firstBlock ? "" : ",") +
            blockJson(block, xi + h.origin.x, yi + h.origin.y, zi + h.origin.z, components.get(`${xi},${yi},${zi}`));
          firstBlock = false;
        }
        if (++inPart >= MAX_BLOCKS_PER_PREFAB) closePart();
      }
    }
  }
  if (inPart > 0) closePart(); // trailing partial part

  zip.add("README.txt", encoder.encode(partsReadme(parts, h)));
  return zip.finish();
}

/**
 * Serialise a {@link SchematicStructure} into a Hytale prefab {@link Blob}: a single
 * `.prefab.json` when the build fits ({@link MAX_BLOCKS_PER_PREFAB}), else a `.zip` of
 * part prefabs (Blob `type` distinguishes them for the download filename).
 */
export function writePrefab(structure: SchematicStructure): Blob {
  const { x: sx, y: sy, z: sz } = structure.dimensions;
  const volume = sx * sy * sz;
  if (volume > MAX_PREFAB_CELLS) {
    throw new Error(
      `.prefab volume (${sx}×${sy}×${sz} = ${volume.toLocaleString()} cells) exceeds the ` +
        `${MAX_PREFAB_CELLS.toLocaleString()}-cell ceiling.`,
    );
  }
  const h = prefabHeader(structure);
  return countNonAir(structure) > MAX_BLOCKS_PER_PREFAB
    ? writePrefabParts(structure, h)
    : writeSinglePrefab(structure, h);
}
