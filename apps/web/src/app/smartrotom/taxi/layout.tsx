"use client"

import type { ReactNode } from "react"
import { useRotomMode } from "@/components/smartrotom/theme/useRotomTheme"
import { TaxiQueryProvider } from "./_components/TaxiQueryProvider"

/**
 * The taxi's scope root (SMARTROTOM_V3 §2). Every `tx-*` token resolves off `.tx-app`,
 * and `data-theme` swaps the palette — the mode comes from the one platform theme picker
 * (§2b), never from an in-app toggle.
 *
 * The height is pinned explicitly (viewport minus the 3rem Rotom nav) rather than chained
 * up through AppWrapper's flex tree with `h-full` — the same way Starbank, ChatApp and
 * Notas root themselves. It matters more here than anywhere: the map is `absolute inset-0`
 * inside this box, so if the height ever failed to resolve the map would have none and the
 * app would render blank.
 */
export default function TaxiLayout({ children }: { children: ReactNode }) {
  const mode = useRotomMode()

  return (
    <TaxiQueryProvider>
      <div
        className="tx-app flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden bg-tx-bg bg-[image:var(--tx-app-bg)] font-tx text-tx-txt antialiased"
        data-theme={mode}
      >
        {children}
      </div>
    </TaxiQueryProvider>
  )
}
