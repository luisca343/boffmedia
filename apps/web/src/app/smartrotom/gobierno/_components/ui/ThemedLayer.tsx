"use client"

import type { ReactNode } from "react"
import { ThemedLayer as SharedThemedLayer } from "@/components/smartrotom/behavior/ThemedLayer"
import { useGobiernoPrefs } from "../../_stores/useGobiernoPrefs"

/** Gobierno's scope-root classes — reused by the ThemedLayer below and by Modal's skin. */
export const GT_SCOPE = "gt-app font-gt text-gt-ink-800"

/**
 * Wraps portaled content — which escapes the `.gt-app` root and would otherwise render
 * with every `gt-*` var unresolved — in a themed layer (SMARTROTOM_V3 §2). The shared
 * layer supplies the scope class; the accent/density preferences are runtime document
 * properties on top of that, so they ride an inner `display:contents` div.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const accent = useGobiernoPrefs((s) => s.accent)
  const density = useGobiernoPrefs((s) => s.density)

  return (
    <SharedThemedLayer scope={GT_SCOPE}>
      <div data-accent={accent} data-density={density} style={{ display: "contents" }}>
        {children}
      </div>
    </SharedThemedLayer>
  )
}
