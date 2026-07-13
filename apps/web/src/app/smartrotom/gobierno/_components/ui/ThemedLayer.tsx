"use client"

import type { ReactNode } from "react"
import { useGobiernoPrefs } from "../../_stores/useGobiernoPrefs"

/**
 * Wraps portaled content — which escapes the `.gt-app` root and would otherwise render
 * with every `gt-*` var unresolved — in a themed layer (SMARTROTOM_V3 §2). The same trick
 * Notas, ChatApp and Taxi use: `display: contents` re-applies the scope without adding a
 * box, so the custom properties inherit but layout is untouched.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const accent = useGobiernoPrefs((s) => s.accent)
  const density = useGobiernoPrefs((s) => s.density)

  return (
    <div
      className="gt-app font-gt text-gt-ink-800"
      data-accent={accent}
      data-density={density}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  )
}
