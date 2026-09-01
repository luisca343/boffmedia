"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { VgcNavProvider, matchParams, type VgcNav } from "@boffmedia/tools-pokemon"

/**
 * The web's routing half of the four VGC tools.
 *
 * The tools keep their whole state in an address — which species, which
 * regulation, which session, which match — but they run in the desktop app too,
 * where there is no URL bar at all. So `@boffmedia/tools-pokemon` owns the
 * address SPACE (the `/pokemon/vgc/...` paths, unchanged) and asks its host for
 * a router. This supplies next/navigation as that router, which is what keeps
 * every existing deep link, back button and shared URL working exactly as it
 * did before the port.
 *
 * `params` comes from the package's own matcher rather than `useParams()`: one
 * implementation of "which segment is the session id", shared by both hosts.
 */
export function VgcRouted({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  const nav = useMemo<VgcNav>(
    () => ({
      path: pathname,
      // `useSearchParams()` returns a ReadonlyURLSearchParams; the tools only
      // read it, but the shared type is the mutable one, so it is copied.
      query: new URLSearchParams(search.toString()),
      params: matchParams(pathname),
      push: (href) => router.push(href),
      replace: (href) => router.replace(href),
    }),
    [router, pathname, search],
  )

  return <VgcNavProvider nav={nav}>{children}</VgcNavProvider>
}
