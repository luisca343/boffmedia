import type { SchematicStructure, UnifiedBlock } from "../../types";

interface OutBlock {
  x: number;
  y: number;
  z: number;
  name: string;
  rotation?: number;
  support?: number;
  filler?: number;
  components?: Record<string, unknown>;
}

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

/**
 * Serialise a {@link SchematicStructure} into a Hytale `.prefab.json` byte
 * buffer.
 *
 * Output is **dense**: a Hytale prefab is a complete rectangular volume, so every
 * cell in the bounding box is emitted — air cells as the `"Empty"` sentinel —
 * ordered x→z→y to match Hytale's own exported prefabs. (A sparse list that omits
 * air cells fails to load in Hytale's prefab editor.) Placement state baked into
 * the palette/tile-entities by {@link loadPrefab} (rotation, support, filler,
 * components, `_State_Definitions_` variants) is reconstructed. When the
 * structure came from a Hytale prefab, the original anchor + origin in
 * `metadata` reproduce the source coordinate space; converted Minecraft builds
 * anchor at the origin.
 */
export function writePrefab(structure: SchematicStructure): Uint8Array {
  const { x: sx, y: sy, z: sz } = structure.dimensions;
  const meta = structure.metadata ?? {};
  const origin = vec3(meta.origin, { x: 0, y: 0, z: 0 });
  const anchor = vec3(meta.anchor, { x: 0, y: 0, z: 0 });

  // Tile entities → components, keyed by local position.
  const components = new Map<string, Record<string, unknown>>();
  for (const te of structure.tileEntities) {
    components.set(`${te.pos.x},${te.pos.y},${te.pos.z}`, te.data);
  }

  // Dense volume: iterate the whole bounding box (x→z→y, matching Hytale's own
  // prefab files) and emit every cell — air becomes the "Empty" sentinel.
  const out: OutBlock[] = [];
  for (let xi = 0; xi < sx; xi++) {
    for (let zi = 0; zi < sz; zi++) {
      for (let yi = 0; yi < sy; yi++) {
        const x = xi + origin.x;
        const y = yi + origin.y;
        const z = zi + origin.z;

        const li = (yi * sz + zi) * sx + xi;
        const pi = structure.blockData[li];
        const block =
          pi >= 0 && pi < structure.palette.length ? structure.palette[pi] : undefined;

        if (!block || block.name === "air") {
          out.push({ x, y, z, name: "Empty" });
          continue;
        }

        const entry: OutBlock = { x, y, z, name: blockName(block) };
        const rotation = intState(block, "rotation");
        if (rotation !== undefined && rotation !== 0) entry.rotation = rotation;
        const support = intState(block, "support");
        if (support !== undefined) entry.support = support;
        const filler = intState(block, "filler");
        if (filler !== undefined) entry.filler = filler;
        const comp = components.get(`${xi},${yi},${zi}`);
        if (comp && isHytaleComponent(comp)) entry.components = comp;

        out.push(entry);
      }
    }
  }

  const doc = {
    // Keep the prefab version when round-tripping a prefab; otherwise emit the
    // current Hytale prefab version (a converted Minecraft schematic carries an
    // unrelated format version that must not leak into the .prefab.json).
    version: structure.format === "prefab" && structure.formatVersion ? structure.formatVersion : 8,
    blockIdVersion: typeof meta.blockIdVersion === "number" ? meta.blockIdVersion : 11,
    anchorX: anchor.x,
    anchorY: anchor.y,
    anchorZ: anchor.z,
    blocks: out,
  };

  return new TextEncoder().encode(JSON.stringify(doc, null, 2));
}
