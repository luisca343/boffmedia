"use client"

import type { ReactNode } from "react"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"
import { useDisplayStore } from "../../_stores/displayStore"
import { displayVars, resolveCanvas } from "../../_utils/display"

/**
 * Re-applies Rooker's scope root to portaled content.
 *
 * Anything rendered through `createPortal` lands on `document.body`, outside `.rk-app`
 * — so every `rk-*` token in it resolves to nothing and it paints unthemed. This is the
 * established fix (SMARTROTOM_V3 §2, Notas' `ThemedLayer`): re-declare the scope root
 * and the accent vars, with `display: contents` so the wrapper themes without adding a
 * box to the layout.
 *
 * Reach for it whenever you portal. The modal and the toast host both do.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const mode = useRotomMode()
  const display = useDisplayStore()
  const canvas = resolveCanvas(mode, display.darkness)

  return (
    <div
      className="rk-app contents font-rk text-rk-fg"
      data-theme={canvas}
      style={displayVars(display)}
    >
      {children}
    </div>
  )
}
