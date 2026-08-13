"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { DocumentSlice, StoreLike, ViewerSlice } from "../state";
import {
  cycleIndex,
  instanceCounts,
  type InstanceCounts,
} from "../render/focus-target";

type FocusStore = DocumentSlice & ViewerSlice;

function useStoreValue<S, T>(store: StoreLike<S>, select: (s: S) => T): T {
  const read = () => select(store.getState());
  return useSyncExternalStore(store.subscribe, read, read);
}

export interface SelectionFocusResult {
  counts: InstanceCounts;
  /** Current stepper position, clamped into [0, counts.navigable). */
  index: number;
  /** False at navigable<=1 — RF-04 hides the stepper rather than showing a dead 1/1. */
  canCycle: boolean;
  /** Re-fly to the current index (bumps the store's focus nonce). */
  locate: () => void;
  next: () => void;
  prev: () => void;
  isolate: boolean;
  toggleIsolate: () => void;
}

/**
 * Owns the locate/cycle/isolate behaviour shared by both tool inspectors.
 * Resolves the active selection — a block group by id, or an LT structure
 * selection — to its navigable instance count via focus-target.ts's pure
 * helpers, and writes only {@link ViewerSlice.focusIndex}/`focusNonce`/`isolate`
 * to the store. The actual position math (instance → world coords) happens in
 * scene.tsx, which is the only place that also has `groups`/`structureHighlight`
 * — this hook never imports anything from `render/` beyond the pure helpers,
 * and never imports a concrete tool store (takes a generic {@link StoreLike}).
 *
 * `diffTotal` is compat's diffEntry.instanceCount for the current selection
 * (RF-08): when it exceeds the client-known navigable count, `counts.culled`
 * flags that some placements were worker-culled and can never be cycled to. A
 * read-only viewer (no diff) omits it, so total === navigable there.
 */
export function useSelectionFocus<S extends FocusStore>(
  store: StoreLike<S>,
  diffTotal?: number,
): SelectionFocusResult {
  const selectedBlockId = useStoreValue(store, (s) => s.selectedBlockId);
  const selectedStructureIdx = useStoreValue(store, (s) => s.selectedStructureIdx);
  const blockPositions = useStoreValue(store, (s) => s.blockPositions);
  const focusIndex = useStoreValue(store, (s) => s.focusIndex);
  const isolate = useStoreValue(store, (s) => s.isolate);

  const group = selectedBlockId
    ? blockPositions.find((g) => g.block.id === selectedBlockId)
    : undefined;

  const counts: InstanceCounts = group
    ? instanceCounts(group, diffTotal)
    : selectedStructureIdx && selectedStructureIdx.length > 0
      ? { navigable: 1, total: 1, culled: false }
      : { navigable: 0, total: 0, culled: false };

  const index = Math.min(Math.max(focusIndex ?? 0, 0), Math.max(0, counts.navigable - 1));
  const canCycle = counts.navigable > 1;

  const request = useCallback((i: number) => store.getState().setFocus(i), [store]);

  const locate = useCallback(() => {
    if (counts.navigable > 0) request(index);
  }, [request, index, counts.navigable]);

  const next = useCallback(() => {
    if (canCycle) request(cycleIndex(index, 1, counts.navigable));
  }, [request, index, counts.navigable, canCycle]);

  const prev = useCallback(() => {
    if (canCycle) request(cycleIndex(index, -1, counts.navigable));
  }, [request, index, counts.navigable, canCycle]);

  const toggleIsolate = useCallback(() => {
    const s = store.getState();
    s.setIsolate(!s.isolate);
  }, [store]);

  return { counts, index, canCycle, locate, next, prev, isolate, toggleIsolate };
}
