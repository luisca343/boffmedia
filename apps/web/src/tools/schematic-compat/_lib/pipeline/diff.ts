import type {
  SchematicStructure,
  BlockRegistry,
  BlockDefinition,
  CompatDiff,
  DiffEntry,
  DiffSummary,
  UnifiedBlock,
} from "@/lib/schematic/types";
import { parseBlockState } from "@/lib/schematic/normalizer";
import RENAMES_JSON from "./rules/known-renames/1.18-1.21.json";
import { crossGameMap } from "./rules/cross-game";

const KNOWN_RENAMES: Record<string, string> = (
  RENAMES_JSON as { renames: Record<string, string> }
).renames;

function countInstances(structure: SchematicStructure): Int32Array {
  const counts = new Int32Array(structure.palette.length);
  const data = structure.blockData;
  for (let i = 0; i < data.length; i++) {
    const idx = data[i];
    if (idx >= 0 && idx < counts.length) counts[idx]++;
  }
  return counts;
}

/**
 * Returns state keys that are present in the block but have values not accepted
 * by the target block definition. Empty array = fully compatible.
 */
function incompatibleStateKeys(
  block: UnifiedBlock,
  targetDef: BlockDefinition
): string[] {
  const bad: string[] = [];
  for (const [key, value] of Object.entries(block.states)) {
    const valid = targetDef.validStates[key];
    if (valid && !valid.includes(value)) bad.push(key);
  }
  return bad;
}

/**
 * Try to find a rename candidate for a block absent from the target registry.
 *
 * Priority:
 *   1. Cross-game mapping table (minecraft:stone → hytale:Rock_Stone, etc.) when
 *      source and target are different games.
 *   2. Bundled known-renames table (grass → short_grass, etc.)
 *   3. Suffix match for mod blocks (create:oak_log → minecraft:oak_log)
 */
function detectRename(
  block: UnifiedBlock,
  targetReg: BlockRegistry,
  crossGame: Record<string, string> | null
): UnifiedBlock | null {
  // 1. Cross-game mapping (only set when source game ≠ target game)
  if (crossGame) {
    const mapped = crossGame[block.id];
    if (mapped && targetReg.blocks.has(mapped)) return parseBlockState(mapped);
  }

  // 2. Bundled known-renames table
  const knownTarget = KNOWN_RENAMES[block.id];
  if (knownTarget && targetReg.blocks.has(knownTarget)) {
    return parseBlockState(knownTarget);
  }

  // 3. Suffix match for non-vanilla blocks
  if (block.namespace !== "minecraft") {
    const candidate = `minecraft:${block.name}`;
    if (targetReg.blocks.has(candidate)) return parseBlockState(candidate);
  }

  return null;
}

const STATUS_ORDER: Record<DiffEntry["status"], number> = {
  missing: 0,
  "mod-only": 1,
  "state-changed": 2,
  renamed: 3,
  safe: 4,
};

/**
 * Diff the schematic palette against source + target registries.
 *
 * Phase 1: safe / missing / mod-only
 * Phase 2: + renamed (known-renames + suffix match) + state-changed (invalid state values)
 */
export function computeDiff(
  structure: SchematicStructure,
  sourceReg: BlockRegistry,
  targetReg: BlockRegistry
): CompatDiff {
  // Cross-game block translation, when converting between different games.
  const crossGame = crossGameMap(sourceReg.gameId, targetReg.gameId);

  const counts = countInstances(structure);

  const summary: DiffSummary = {
    total: 0,
    safe: 0,
    renamed: 0,
    stateChanged: 0,
    missing: 0,
    modOnly: 0,
  };

  // Aggregate by block id: a palette can hold many entries that share an id but
  // differ only in state (e.g. byg:willow_leaves with each distance/waterlogged
  // combination). Resolutions are keyed per id, so the diff is too — one row per
  // block type, with instance counts summed and incompatible state keys unioned.
  interface Agg {
    block: UnifiedBlock; // representative (states cleared — it spans every variant)
    instanceCount: number;
    targetDef?: BlockDefinition;
    badKeys: Set<string>;
    renamed: UnifiedBlock | null;
  }
  const byId = new Map<string, Agg>();

  for (let i = 0; i < structure.palette.length; i++) {
    const block = structure.palette[i];
    const instanceCount = counts[i];
    if (instanceCount === 0) continue;
    if (block.name === "air") continue;

    summary.total += instanceCount;

    let agg = byId.get(block.id);
    if (!agg) {
      const targetDef = targetReg.blocks.get(block.id);
      agg = {
        block: { ...block, states: {} },
        instanceCount: 0,
        targetDef,
        badKeys: new Set(),
        renamed: targetDef ? null : detectRename(block, targetReg, crossGame),
      };
      byId.set(block.id, agg);
    }

    agg.instanceCount += instanceCount;
    if (agg.targetDef) {
      for (const key of incompatibleStateKeys(block, agg.targetDef)) agg.badKeys.add(key);
    }
  }

  const entries: DiffEntry[] = [];
  for (const agg of byId.values()) {
    const { block, instanceCount } = agg;
    if (agg.targetDef) {
      if (agg.badKeys.size > 0) {
        summary.stateChanged += instanceCount;
        entries.push({
          block,
          status: "state-changed",
          instanceCount,
          incompatibleStates: [...agg.badKeys],
        });
      } else {
        summary.safe += instanceCount;
        entries.push({ block, status: "safe", instanceCount });
      }
    } else if (agg.renamed) {
      summary.renamed += instanceCount;
      entries.push({ block, status: "renamed", instanceCount, autoCandidate: agg.renamed });
    } else if (block.source === "mod") {
      summary.modOnly += instanceCount;
      entries.push({ block, status: "mod-only", instanceCount });
    } else {
      summary.missing += instanceCount;
      entries.push({ block, status: "missing", instanceCount });
    }
  }

  entries.sort((a, b) => {
    const d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    return d !== 0 ? d : b.instanceCount - a.instanceCount;
  });

  return { summary, entries };
}
