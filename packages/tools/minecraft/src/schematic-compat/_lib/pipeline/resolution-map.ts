import { parseBlockState } from "../../../engine/normalizer";
import type { CompatDiff, ResolutionMap } from "../../../engine/types";

type Choices = Record<string, { targetId: string }>;

/** Build the worker-side {@link ResolutionMap} from the store's lightweight choices. */
export function toResolutionMap(resolutions: Choices): ResolutionMap {
  const map: ResolutionMap = {};
  for (const [sourceId, choice] of Object.entries(resolutions)) {
    if (!choice.targetId) continue;
    map[sourceId] = { target: parseBlockState(choice.targetId), applyToAll: true };
  }
  return map;
}

/**
 * The resolution map used for an actual export. Folds in the diff's automatic
 * conversions so they take effect on the written file — renamed blocks map to
 * their detected candidate, and state-changed blocks re-map onto themselves so
 * the state transformer drops their invalid states. Explicit user choices (the
 * per-row replacement comboboxes) are layered on top and win, which is how the
 * "select a different block, in case the automatic one is wrong" override works.
 */
export function buildExportResolutionMap(
  diff: CompatDiff | undefined,
  resolutions: Choices,
): ResolutionMap {
  const map: ResolutionMap = {};
  for (const e of diff?.entries ?? []) {
    if (e.status === "renamed" && e.autoCandidate) {
      map[e.block.id] = { target: e.autoCandidate, applyToAll: true };
    } else if (e.status === "state-changed") {
      // Same id, no stateMap → transformStates substitutes target defaults for
      // the invalid state values.
      map[e.block.id] = { target: e.block, applyToAll: true };
    }
  }
  // Explicit per-row overrides take precedence over the automatic mapping.
  for (const [sourceId, choice] of Object.entries(resolutions)) {
    if (!choice.targetId) continue;
    map[sourceId] = { target: parseBlockState(choice.targetId), applyToAll: true };
  }
  return map;
}
