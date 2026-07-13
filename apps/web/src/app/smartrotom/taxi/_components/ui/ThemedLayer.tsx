"use client"

import type { ReactNode } from "react"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"

/**
 * Wraps portaled content — which escapes the `.tx-app` root and would otherwise render
 * with every `tx-*` var unresolved — in a themed layer (SMARTROTOM_V3 §2). The same
 * trick Notas and ChatApp use: `display: contents` re-applies the scope without adding
 * a box, so custom properties inherit but layout is untouched.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const mode = useRotomMode()
  return (
    <div className="tx-app font-tx text-tx-txt" data-theme={mode} style={{ display: "contents" }}>
      {children}
    </div>
  )
}
