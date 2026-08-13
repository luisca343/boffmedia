/**
 * Pure camera-framing and instance-cycling math for the locate/isolate
 * feature (RF-01..RF-04, RF-08). No three.js or React import — this module is
 * shared by scene.tsx (which has the render-time `groups`/`structureHighlight`
 * data to resolve a request into a world position) and by the actions layer
 * (useSelectionFocus, useViewerShortcuts), which only ever handle counts and
 * indices.
 */

/** A lightweight subset of {@link BlockPositionGroup} — just what this module needs. */
export interface InstanceGroupLike {
  positions: Float32Array;
  interiorPositions?: Float32Array;
}

/** A lightweight subset of {@link LittleTilesStructure} — just what this module needs. */
export interface StructureLike {
  boxes: Float32Array;
  cornerBounds?: Float32Array;
}

/** {@link SchematicSceneProps.focus}: a request by index, never a position — a
 * nonce bump re-flies to the same placement (RF-03 wrap-around). */
export interface FocusRequest {
  index: number;
  nonce: number;
}

/** Resolved fly-to goal, framed the same way CameraRig frames the whole build. */
export interface FocusGoal {
  position: [number, number, number];
  target: [number, number, number];
}

/** Framing radius (in blocks) used to frame a single located instance/structure —
 * much tighter than the whole-schematic span CameraRig uses on initial load. */
export const FOCUS_SPAN = 6;

/** Center of instance `index` in a flat stride-3 positions array, or null out of range. */
export function instanceCenterAt(
  positions: Float32Array,
  index: number,
): [number, number, number] | null {
  if (index < 0) return null;
  const o = index * 3;
  if (o + 2 >= positions.length) return null;
  return [positions[o], positions[o + 1], positions[o + 2]];
}

/** Total navigable instances of a block group: surface + interior sets combined. */
export function navigableCount(group: InstanceGroupLike | undefined): number {
  if (!group) return 0;
  return (group.positions.length + (group.interiorPositions?.length ?? 0)) / 3;
}

/**
 * Center of combined index `index` across a group's surface positions, then its
 * interior positions — the same combined numbering {@link navigableCount} totals
 * and {@link cycleIndex} cycles over. Used by scene.tsx to resolve a
 * {@link FocusRequest} into a world position without re-deriving the split.
 */
export function instanceCenterInGroup(
  group: InstanceGroupLike,
  index: number,
): [number, number, number] | null {
  const surfaceCount = group.positions.length / 3;
  if (index < surfaceCount) return instanceCenterAt(group.positions, index);
  const interior = group.interiorPositions;
  if (!interior) return null;
  return instanceCenterAt(interior, index - surfaceCount);
}

export interface InstanceCounts {
  /** Instances the client can actually cycle to (surface + interior it has data for). */
  navigable: number;
  /** Best-known total — compat's diffEntry.instanceCount when given, else navigable. */
  total: number;
  /** True when total > navigable: some placements exist that the worker culled
   *  client-side (see CULL_THRESHOLD) and prev/next can never reach (RF-08). */
  culled: boolean;
}

/** RF-08: make the client-known-vs-total divergence explicit rather than silently wrong. */
export function instanceCounts(
  group: InstanceGroupLike | undefined,
  totalFromDiff?: number,
): InstanceCounts {
  const navigable = navigableCount(group);
  const total = totalFromDiff ?? navigable;
  return { navigable, total, culled: total > navigable };
}

/** Next index in [0, count) after stepping `delta` from `current`, wrapping both ways. */
export function cycleIndex(current: number, delta: number, count: number): number {
  if (count <= 0) return 0;
  return ((current + delta) % count + count) % count;
}

/**
 * Fly-to goal for a world-space `center`, reusing CameraRig's framing ratios
 * (dist = span * 2.2, offset 0.55/0.45/0.85 on x/y/z) so a located instance is
 * framed with the same feel as the initial whole-build shot — just centered on
 * the instance instead of the schematic's midpoint.
 */
export function cameraGoalFor(center: [number, number, number], span: number): FocusGoal {
  const dist = span * 2.2;
  return {
    position: [
      center[0] + dist * 0.55,
      center[1] + dist * 0.45,
      center[2] + dist * 0.85,
    ],
    target: center,
  };
}

/**
 * Centroid of a LittleTiles structure's geometry — its stride-9 `boxes` (host
 * cell + min/max fractions, same layout as {@link LittleTilesGroup.boxes}) plus
 * any transformable boxes' world-space `cornerBounds` AABBs. Shares this one
 * code path with block-instance framing (RF-02) via {@link cameraGoalFor}.
 */
export function structureCenterOf(structure: StructureLike): [number, number, number] | null {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const boxes = structure.boxes;
  const count = boxes.length / 9;
  for (let i = 0; i < count; i++) {
    const o = i * 9;
    const bx = boxes[o];
    const by = boxes[o + 1];
    const bz = boxes[o + 2];
    const x0 = bx - 0.5 + boxes[o + 3];
    const x1 = bx - 0.5 + boxes[o + 6];
    const y0 = by - 0.5 + boxes[o + 4];
    const y1 = by - 0.5 + boxes[o + 7];
    const z0 = bz - 0.5 + boxes[o + 5];
    const z1 = bz - 0.5 + boxes[o + 8];
    if (x0 < minX) minX = x0;
    if (x1 > maxX) maxX = x1;
    if (y0 < minY) minY = y0;
    if (y1 > maxY) maxY = y1;
    if (z0 < minZ) minZ = z0;
    if (z1 > maxZ) maxZ = z1;
  }

  const bounds = structure.cornerBounds;
  const boundCount = bounds ? bounds.length / 6 : 0;
  for (let i = 0; i < boundCount; i++) {
    const o = i * 6;
    const b = bounds as Float32Array;
    if (b[o] < minX) minX = b[o];
    if (b[o + 3] > maxX) maxX = b[o + 3];
    if (b[o + 1] < minY) minY = b[o + 1];
    if (b[o + 4] > maxY) maxY = b[o + 4];
    if (b[o + 2] < minZ) minZ = b[o + 2];
    if (b[o + 5] > maxZ) maxZ = b[o + 5];
  }

  if (!Number.isFinite(minX)) return null;
  return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
}
