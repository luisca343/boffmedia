"use client"

import type { ReactNode } from "react"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"

/**
 * Re-applies an app's token scope to content that escapes its scope root
 * (portals render under document.body, where every per-app CSS var is
 * unresolved). `display: contents` re-applies the scope without adding a box,
 * so custom properties inherit but layout is untouched.
 *
 * `scope` is the app's root class list, e.g. "tx-app font-tx text-tx-txt".
 */
export function ThemedLayer({ scope, children }: { scope: string; children: ReactNode }) {
  const mode = useRotomMode()
  return (
    <div className={scope} data-theme={mode} style={{ display: "contents" }}>
      {children}
    </div>
  )
}
