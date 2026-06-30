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
 * Serialise a {@link SchematicStructure} into a Hytale `.prefab.json` byte
 * buffer.
 *
 * Output is sparse (Empty cells are omitted — coordinates are explicit, so the
 * file stays small for mostly-air converted Minecraft builds). Placement state
 * baked into the palette/tile-entities by {@link loadPrefab} (rotation, support,
 * filler, components, `_State_Definitions_` variants) is reconstructed. When the
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

  const out: OutBlock[] = [];
  for (let yi = 0; yi < sy; yi++) {
    for (let zi = 0; zi < sz; zi++) {
      for (let xi = 0; xi < sx; xi++) {
        const li = (yi * sz + zi) * sx + xi;
        const pi = structure.blockData[li];
        if (pi < 0 || pi >= structure.palette.length) continue;
        const block = structure.palette[pi];
        if (block.name === "air") continue;

        const entry: OutBlock = {
          x: xi + origin.x,
          y: yi + origin.y,
          z: zi + origin.z,
          name: blockName(block),
        };
        const rotation = intState(block, "rotation");
        if (rotation !== undefined && rotation !== 0) entry.rotation = rotation;
        const support = intState(block, "support");
        if (support !== undefined) entry.support = support;
        const filler = intState(block, "filler");
        if (filler !== undefined) entry.filler = filler;
        const comp = components.get(`${xi},${yi},${zi}`);
        if (comp) entry.components = comp;

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
