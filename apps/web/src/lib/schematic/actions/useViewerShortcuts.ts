"use client";

import { useEffect } from "react";
import type { DocumentSlice, StoreLike, ViewerSlice } from "../state";
import { cycleIndex, navigableCount } from "../render/focus-target";

type ShortcutStore = DocumentSlice & ViewerSlice;

/** Navigable instances of whichever selection (block group or LT structure) is active. */
function activeNavigableCount(s: ShortcutStore): number {
  if (s.selectedBlockId) {
    const group = s.blockPositions.find((g) => g.block.id === s.selectedBlockId);
    return group ? navigableCount(group) : 0;
  }
  if (s.selectedStructureIdx && s.selectedStructureIdx.length > 0) return 1;
  return 0;
}

/**
 * F toggles orbit/fly, PageUp/PageDown steps the Y-layer, L locates the current
 * selection, [ and ] cycle its placements, I toggles isolate. The handler reads
 * the store directly so the listener binds once for the page's lifetime.
 */
export function useViewerShortcuts<S extends ShortcutStore>(store: StoreLike<S>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = store.getState();
      if (!s.schematic) return;
      if (e.code === "KeyF") {
        e.preventDefault();
        s.setNavMode(s.navMode === "fly" ? "orbit" : "fly");
      } else if (e.code === "PageUp") {
        e.preventDefault();
        s.setLayerY(Math.min(s.schematic.dimensions.y - 1, s.layerY + 1));
      } else if (e.code === "PageDown") {
        e.preventDefault();
        s.setLayerY(Math.max(0, s.layerY - 1));
      } else if (e.code === "KeyL") {
        e.preventDefault();
        if (activeNavigableCount(s) > 0) s.setFocus(s.focusIndex ?? 0);
      } else if (e.code === "BracketRight") {
        e.preventDefault();
        const count = activeNavigableCount(s);
        if (count > 1) s.setFocus(cycleIndex(s.focusIndex ?? 0, 1, count));
      } else if (e.code === "BracketLeft") {
        e.preventDefault();
        const count = activeNavigableCount(s);
        if (count > 1) s.setFocus(cycleIndex(s.focusIndex ?? 0, -1, count));
      } else if (e.code === "KeyI") {
        e.preventDefault();
        if (s.selectedBlockId || (s.selectedStructureIdx && s.selectedStructureIdx.length > 0)) {
          s.setIsolate(!s.isolate);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);
}
