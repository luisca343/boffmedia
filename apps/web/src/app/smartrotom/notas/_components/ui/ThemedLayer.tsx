"use client";

import type { ReactNode } from "react";
import { useNotesTheme } from "../../_hooks/useNotesTheme";

// Wraps portaled content (which escapes the `.nt-app` root) in a themed layer so
// the nt-* CSS vars + runtime accent resolve. `display:contents` keeps layout
// untouched while custom properties still inherit to descendants.
export function ThemedLayer({ children }: { children: ReactNode }) {
  const { theme, accentStyle } = useNotesTheme();
  return (
    <div className="nt-app font-nt" data-theme={theme} style={{ display: "contents", ...accentStyle }}>
      {children}
    </div>
  );
}
