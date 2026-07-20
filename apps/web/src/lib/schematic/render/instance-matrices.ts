"use client";

import { useEffect } from "react";
import type * as THREE from "three";
import { cutoffCount, sliceRange } from "./picking";

function writeTranslation(mat: Float32Array, slot: number, positions: Float32Array, src: number) {
  const b = slot * 16;
  mat[b]      = 1; mat[b + 1]  = 0; mat[b + 2]  = 0; mat[b + 3]  = 0;
  mat[b + 4]  = 0; mat[b + 5]  = 1; mat[b + 6]  = 0; mat[b + 7]  = 0;
  mat[b + 8]  = 0; mat[b + 9]  = 0; mat[b + 10] = 1; mat[b + 11] = 0;
  mat[b + 12] = positions[src];
  mat[b + 13] = positions[src + 1];
  mat[b + 14] = positions[src + 2];
  mat[b + 15] = 1;
}

/**
 * Write per-instance translation matrices and apply the Y-layer visibility rule.
 * Worker positions are Y-sorted, so cutoffs are binary searches, not scans.
 *  - surface (slice=false): matrices written once per mesh identity; the cutoff
 *    effect trims `count` to cells with y ≤ maxLayerY.
 *  - interior (slice=true): only the y === maxLayerY window is ever visible
 *    (that's the moment slicing exposes an enclosed cell), so its matrices are
 *    rewritten on each layer change — at most one Y-plane, so the rewrite is
 *    tiny. `capacity` is the largest such window (see maxSliceCount).
 * Re-runs whenever the mesh is recreated (meshEpoch) — e.g. when a block swaps
 * from the cube fallback to its compiled model.
 */
export function useInstanceMatrices(
  meshRef: React.RefObject<THREE.InstancedMesh | null>,
  positions: Float32Array,
  capacity: number,
  maxLayerY: number,
  meshEpoch: unknown,
  slice: boolean,
) {
  useEffect(() => {
    const mesh = meshRef.current;
    if (slice || !mesh || capacity === 0) return;
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < capacity; i++) writeTranslation(mat, i, positions, i * 3);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = capacity;
    // meshEpoch is in deps so matrices are rewritten when the mesh is recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, capacity, slice, meshEpoch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (slice || !mesh || capacity === 0) return;
    mesh.count = cutoffCount(positions, maxLayerY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLayerY, positions, capacity, slice, meshEpoch]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!slice || !mesh || capacity === 0) return;
    const [first, len] = sliceRange(positions, maxLayerY);
    const count = Math.min(len, capacity);
    const mat = mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < count; i++) writeTranslation(mat, i, positions, (first + i) * 3);
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxLayerY, positions, capacity, slice, meshEpoch]);
}
