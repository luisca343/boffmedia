/**
 * State-aware block transformer.
 *
 * Takes a source block + a target BlockDefinition and produces a target block
 * with semantically correct states:
 *   1. Apply explicit rule overrides (highest priority)
 *   2. Carry source states that are valid in the target as-is
 *   3. Invalid values → use target default + emit a warning (semantic states only)
 *   4. Keys absent from target definition → drop silently
 *   5. Remaining required target keys → fill with target defaults
 *
 * "Semantic states" are properties that carry positional/functional meaning
 * (facing, waterlogged, etc.) — we warn if they had to be defaulted so the
 * user knows the structure might look or behave differently after export.
 */
import { parseBlockState } from "../normalizer";
import type { UnifiedBlock, BlockDefinition } from "../../types";

const SEMANTIC_STATES = new Set([
  "facing",
  "half",
  "type",
  "hinge",
  "open",
  "waterlogged",
  "power",
  "axis",
  "persistent",
  "distance",
  // Fence/wall connections are positional — warn if forced to default
  "north",
  "south",
  "east",
  "west",
  "up",
]);

export function transformStates(
  source: UnifiedBlock,
  targetDef: BlockDefinition,
  ruleOverrides?: Record<string, string>
): { block: UnifiedBlock; warnings: string[] } {
  const resultStates: Record<string, string> = {};
  const warnings: string[] = [];

  // 1. Explicit overrides (highest priority)
  if (ruleOverrides) {
    for (const [key, value] of Object.entries(ruleOverrides)) {
      if (targetDef.validStates[key]?.includes(value)) {
        resultStates[key] = value;
      }
    }
  }

  // 2+3. Source states
  for (const [key, value] of Object.entries(source.states)) {
    if (key in resultStates) continue; // already set by override
    const valid = targetDef.validStates[key];
    if (!valid) continue; // key not present in target → drop silently

    if (valid.includes(value)) {
      resultStates[key] = value;
    } else {
      const def = targetDef.defaultState[key];
      if (def !== undefined) {
        resultStates[key] = def;
        if (SEMANTIC_STATES.has(key)) {
          warnings.push(`${key}: "${value}" is not valid in target — using default "${def}"`);
        }
      }
    }
  }

  // 5. Fill remaining target keys with defaults
  for (const [key, validValues] of Object.entries(targetDef.validStates)) {
    if (key in resultStates) continue;
    const def = targetDef.defaultState[key] ?? validValues[0];
    if (def !== undefined) resultStates[key] = def;
  }

  // Build blockstate string and parse it back for a consistent UnifiedBlock
  const stateKeys = Object.keys(resultStates).sort();
  const stateStr =
    stateKeys.length === 0
      ? targetDef.id
      : `${targetDef.id}[${stateKeys.map((k) => `${k}=${resultStates[k]}`).join(",")}]`;

  return { block: parseBlockState(stateStr), warnings };
}
