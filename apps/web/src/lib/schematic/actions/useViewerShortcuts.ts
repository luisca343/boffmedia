"use client";

import { useEffect } from "react";
import type { DocumentSlice, StoreLike, ViewerSlice } from "../state";

type ShortcutStore = DocumentSlice & ViewerSlice;

/**
 * F toggles orbit/fly, PageUp/PageDown steps the Y-layer. The handler reads the
 * store directly so the listener binds once for the page's lifetime.
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store]);
}
