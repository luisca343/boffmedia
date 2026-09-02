"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { MewNavProvider, MewRoot, useHashMewNav, type MewScreen } from "@boffmedia/tools-mewgenics"

/**
 * The web's routing half of the Mewgenics tools.
 *
 * Both screens keep their state in the URL hash — the codex's category and
 * entry, the builder's whole cat — and both run in the desktop app too, where
 * there is no address bar to keep it in. So `@boffmedia/tools-mewgenics` owns
 * the address SPACE (the same `#?c=items&id=…` and `#<build>` strings, byte for
 * byte) and asks its host for a backing. This supplies the real one, which is
 * what keeps every deep link and shared URL working exactly as before.
 *
 * `screen` is a prop rather than something derived from the pathname because
 * apps/web has one route per screen: the route that rendered this component
 * already IS the answer, and re-deriving it from `usePathname` would be a
 * second place for it to be wrong.
 */
export function MewRouted({ screen }: { screen: MewScreen }) {
  const router = useRouter()
  const navigate = useCallback((route: string) => router.push(route), [router])
  const nav = useHashMewNav(screen, navigate)

  return (
    <MewNavProvider nav={nav}>
      <MewRoot />
    </MewNavProvider>
  )
}
