/**
 * Splitting a block group by neighbour-derived state.
 *
 * The viewer draws one instanced mesh per block *type*, which assumes every
 * instance of a type has the same geometry. A connected block breaks that
 * assumption — two painted lanes of the same id render different arms depending
 * on what is beside them (see `model/connected-states.ts`). So a group of those
 * is partitioned into one sub-group per distinct derived state, each of which is
 * then an ordinary instanced draw of a single shape.
 *
 * The number of sub-groups is bounded by the block's real state space (a lane has
 * at most 16 arm combinations × 3 facings), so this stays instanced rather than
 * degenerating into one draw call per block.
 */

import { deriveConnectedStates, hasConnectedStates, type BlockAt } from "../model/connected-states";
import type { BlockPositionGroup } from "../types";

/** Axis span the position key packs; volumes are local and 0-based. */
const AXIS = 4096;

function keyOf(x: number, y: number, z: number): number {
  return (x * AXIS + y) * AXIS + z;
}

/**
 * A position → block id lookup over every group, including interior cells.
 *
 * Interiors matter: a barrier buried in a wall is still a neighbour of the
 * barrier beside it, and omitting enclosed cells would make runs look broken
 * exactly where they are most solid.
 */
export function buildBlockAt(groups: BlockPositionGroup[]): BlockAt {
  const index = new Map<number, string>();
  const add = (positions: Float32Array | undefined, id: string) => {
    if (!positions) return;
    for (let i = 0; i < positions.length; i += 3) {
      index.set(keyOf(positions[i], positions[i + 1], positions[i + 2]), id);
    }
  };
  for (const group of groups) {
    add(group.positions, group.block.id);
    add(group.interiorPositions, group.block.id);
  }
  return (x, y, z) =>
    x < 0 || y < 0 || z < 0 || x >= AXIS || y >= AXIS || z >= AXIS
      ? null
      : (index.get(keyOf(x, y, z)) ?? null);
}

export interface ConnectedSubGroup {
  /** Stable within the parent group — the derived states, serialized. */
  key: string;
  states: Record<string, string>;
  positions: Float32Array;
  interiorPositions?: Float32Array;
}

function statesKey(states: Record<string, string>): string {
  return Object.keys(states)
    .sort()
    .map((k) => `${k}=${states[k]}`)
    .join(",");
}

/**
 * Partition one group's instances by their derived state. Returns `null` when the
 * block has no neighbour-derived state, so the caller keeps its single-draw path
 * untouched.
 */
export function partitionConnected(
  group: BlockPositionGroup,
  states: Record<string, string>,
  at: BlockAt,
): ConnectedSubGroup[] | null {
  if (!hasConnectedStates(group.block.id)) return null;

  const buckets = new Map<string, { states: Record<string, string>; xs: number[]; interior: number[] }>();

  const collect = (positions: Float32Array | undefined, interior: boolean) => {
    if (!positions) return;
    for (let i = 0; i < positions.length; i += 3) {
      const [x, y, z] = [positions[i], positions[i + 1], positions[i + 2]];
      const derived = deriveConnectedStates(group.block.id, states, x, y, z, at);
      const key = statesKey(derived);
      let bucket = buckets.get(key);
      if (!bucket) buckets.set(key, (bucket = { states: derived, xs: [], interior: [] }));
      (interior ? bucket.interior : bucket.xs).push(x, y, z);
    }
  };
  collect(group.positions, false);
  collect(group.interiorPositions, true);

  const out: ConnectedSubGroup[] = [];
  for (const [key, bucket] of buckets) {
    out.push({
      key,
      states: bucket.states,
      positions: new Float32Array(bucket.xs),
      ...(bucket.interior.length ? { interiorPositions: new Float32Array(bucket.interior) } : {}),
    });
  }
  return out;
}
