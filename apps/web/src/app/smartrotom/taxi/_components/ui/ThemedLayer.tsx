"use client"

import type { ReactNode } from "react"
import { ThemedLayer as SharedThemedLayer } from "@/components/smartrotom/behavior/ThemedLayer"

/** The taxi's scope-root classes — reused by the ThemedLayer below and by Modal's skin. */
export const TX_SCOPE = "tx-app font-tx text-tx-txt"

/**
 * Wraps portaled content — which escapes the `.tx-app` root and would otherwise render
 * with every `tx-*` var unresolved — in a themed layer.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  return <SharedThemedLayer scope={TX_SCOPE}>{children}</SharedThemedLayer>
}
