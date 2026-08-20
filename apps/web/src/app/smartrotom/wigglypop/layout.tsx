"use client"

import { useEffect, type ReactNode } from "react"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { WigglypopQueryProvider } from "./_components/WigglypopQueryProvider"
import { WigglypopShell } from "./_components/WigglypopShell"
import { ToastHost } from "./_components/ui"

/**
 * Wigglypop's scope root. Every `wp-*` token is a CSS var
 * declared on `.wp-app`, so nothing inside the app resolves without it — and
 * anything portaled OUT of it (modals, toasts) has to re-apply it via `ThemedLayer`.
 *
 * Light-only: there is no `data-theme`. The pink-cream page IS the product, so like
 * Furret Today and Gobierno the app ignores the platform theme picker's mode.
 *
 * The height is pinned explicitly (viewport minus the 3rem Rotom nav) rather than
 * chained up through AppWrapper's flex tree — the feed is a `min-h-0` flex child,
 * and an unresolved height would collapse the grid. Same rooting as the PC and Taxi.
 */
export default function WigglypopLayout({ children }: { children: ReactNode }) {
  const fetchManifest = useSpriteManifestStore((s) => s.fetchManifest)
  const manifest = useSpriteManifestStore((s) => s.manifest)

  // Every sprite on every card resolves through the manifest. Fetched once here
  // rather than by each of the sixty cards in the feed.
  useEffect(() => {
    if (!manifest) void fetchManifest()
  }, [manifest, fetchManifest])

  return (
    <WigglypopQueryProvider>
      <div className="wp-app flex h-[calc(100dvh_-_3rem)] w-full min-w-0 flex-col overflow-hidden font-wp text-wp-fg">
        <WigglypopShell>{children}</WigglypopShell>
        <ToastHost />
      </div>
    </WigglypopQueryProvider>
  )
}
