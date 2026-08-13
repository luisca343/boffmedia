/**
 * Legacy (pre-flattening) block tables for MCEdit `.schematic` files and
 * pre-1.13 `.mca` regions, generated from WorldEdit's legacy table by
 * `generate-legacy.mjs` and validated against the bundled vanilla 1.16.5
 * registry — see that script for provenance.
 *
 * `blocks`: `"blockId:meta"` → modern blockstate string.
 * `names` : 1.12 block name → numeric id, for references that carry names with
 *           legacy metadata instead of ids (e.g. LittleTiles "minecraft:wool:2").
 */
import { parseBlockState } from "../../normalizer";
import type { LegacyIdMap, UnifiedBlock } from "../../types";

export interface LegacyTables {
  blocks: Record<string, string>;
  names: Record<string, number>;
}

let tablesPromise: Promise<LegacyTables> | null = null;

/** Lazily import the bundled tables (~100 KB) — only legacy loads pay for it. */
export function loadLegacyTables(): Promise<LegacyTables> {
  tablesPromise ??= import("./1.12.json").then((mod) => {
    const file = (mod.default ?? mod) as LegacyTables;
    return { blocks: file.blocks, names: file.names };
  });
  return tablesPromise;
}

/** Build a modded block entry from a resolved `namespace:name` + its legacy meta. */
export function moddedBlock(fullName: string, meta: number): UnifiedBlock {
  const colon = fullName.indexOf(":");
  const namespace = colon === -1 ? "minecraft" : fullName.slice(0, colon);
  const name = colon === -1 ? fullName : fullName.slice(colon + 1);
  return {
    id: `${namespace}:${name}`,
    namespace,
    name,
    // Pre-flattening metadata is the block's variant, but which property it maps
    // to lives in the mod's Java (`getStateFromMeta`), not in its assets — so it
    // is carried verbatim rather than guessed at.
    states: meta !== 0 ? { meta: String(meta) } : {},
    tags: [],
    source: namespace === "minecraft" ? "vanilla" : "mod",
    ...(namespace === "minecraft" ? {} : { modId: namespace }),
  };
}

/**
 * Translate one pre-flattening `id:meta` pair into a modern block.
 *
 * Resolution order is deliberate: vanilla numeric ids are fixed in every world,
 * so the bundled table outranks any world map; mod ids exist only in the world
 * that assigned them, hence `level.dat` first and the file's own Schematica
 * mapping as the fallback.
 */
export function resolveLegacyBlock(
  id: number,
  meta: number,
  table: Record<string, string>,
  worldIds: LegacyIdMap | undefined,
  schematicaIds: Map<number, string> | undefined,
  unknownIds: Set<number>,
): UnifiedBlock {
  if (id === 0) return parseBlockState("minecraft:air");
  // WorldEdit's fallback chain: exact id:meta, then the block's meta-0 entry.
  const mapped = table[`${id}:${meta}`] ?? table[`${id}:0`];
  if (mapped) return parseBlockState(mapped);

  const name = worldIds?.get(id) ?? schematicaIds?.get(id);
  if (name) return moddedBlock(name, meta);

  unknownIds.add(id);
  return {
    id: `unknown:block_${id}`,
    namespace: "unknown",
    name: `block_${id}`,
    states: meta !== 0 ? { meta: String(meta) } : {},
    tags: [],
    source: "mod",
    modId: "unknown",
  };
}
