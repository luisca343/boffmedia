"use client"

import type { ReactNode } from "react"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"
import { ThemedLayer as SharedThemedLayer } from "@/components/smartrotom/behavior/ThemedLayer"
import { useDisplayStore } from "../../_stores/displayStore"
import { displayVars, resolveCanvas } from "../../_utils/display"

/** Rooker's scope-root classes — reused by the ThemedLayer below and by Modal's skin. */
export const RK_SCOPE = "rk-app font-rk text-rk-fg"

/**
 * Re-applies Rooker's scope root to portaled content.
 *
 * Anything rendered through `createPortal` lands on `document.body`, outside `.rk-app`
 * — so every `rk-*` token in it resolves to nothing and it paints unthemed. The shared
 * layer re-declares the scope root + `data-theme`; the reader's accent and body-face
 * vars are runtime values on top of that, so they ride an inner `display:contents` div.
 *
 * Reach for it whenever you portal. The modal and the toast host both do.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const mode = useRotomMode()
  const display = useDisplayStore()
  const canvas = resolveCanvas(mode, display.darkness)

  return (
    <SharedThemedLayer scope={RK_SCOPE}>
      <div data-theme={canvas} style={{ display: "contents", ...displayVars(display) }}>
        {children}
      </div>
    </SharedThemedLayer>
  )
}
