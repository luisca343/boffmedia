"use client";

import type { ReactNode } from "react";
import { ThemedLayer as SharedThemedLayer } from "@/components/smartrotom/behavior/ThemedLayer";
import { useNotesTheme } from "../../_hooks/useNotesTheme";

/** Notas' scope-root classes — reused by the ThemedLayer below and by Modal-like skins. */
export const NT_SCOPE = "nt-app font-nt";

// Wraps portaled content (which escapes the `.nt-app` root) in a themed layer so
// the nt-* CSS vars + runtime accent resolve. The shared layer supplies the scope
// class + `data-theme`; the runtime accent override still needs its own inline
// style, so it rides on an inner `display:contents` div.
export function ThemedLayer({ children }: { children: ReactNode }) {
  const { accentStyle } = useNotesTheme();
  return (
    <SharedThemedLayer scope={NT_SCOPE}>
      <div style={{ display: "contents", ...accentStyle }}>{children}</div>
    </SharedThemedLayer>
  );
}
