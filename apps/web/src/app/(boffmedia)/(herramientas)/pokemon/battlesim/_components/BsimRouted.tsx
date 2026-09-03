"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BsimRoot,
  BSIM_ROUTES,
  battlesimToolsFor,
  matchBsimRoute,
  useHashBsimNav,
} from "@boffmedia/tools-battlesim"

/**
 * The web's routing half of battlesim.
 *
 * `@boffmedia/tools-battlesim` owns the screens and the address SPACE; the two
 * hosts differ only in what backs that space. Here it is the real router and
 * the real URL, which is what keeps `/pokemon/battlesim/replay/<id>` a
 * shareable link and keeps the tool indexable. In the launcher the same seam is
 * an in-memory stack, because there is no address bar to put it in.
 *
 * MOUNTED ONCE, BY THE ROUTE GROUP'S `layout.tsx`, AND THAT IS THE POINT. This
 * used to be rendered by each `page.tsx`, with the screen passed in as a prop —
 * "the route that rendered this component already IS the answer". It was the
 * right answer to the wrong question: one page component per screen means a
 * different React tree per screen, so every in-tool navigation unmounted the
 * whole tool. That is survivable for a lobby and fatal for the thing the tool
 * now does — a local AI battle is a Web Worker and a `BattleSession` living in
 * that tree, so "go and look at your teams" destroyed every running battle. A
 * layout persists across its child routes; the screen therefore has to come
 * from the ADDRESS instead, which `matchBsimRoute` reads off the same table the
 * writes go through.
 *
 * D5: the website is the host that CAN relay Pokémon Showdown, so it opts in
 * here. The launcher passes `false` in its own registration.
 */
battlesimToolsFor({ showdownProxy: true })

export function BsimRouted() {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams()

  /**
   * The address, mirrored.
   *
   * `usePathname` updates in a layout; `useSearchParams` is documented as
   * possibly STALE there, because layouts do not re-render on a navigation
   * between their own children. Half this tool's state lives in the query
   * (`?tab=equipos`, `?roomId=…`, `?source=local`), so a stale reading is a
   * tab bar pointing at the wrong tab. The mirror closes that: our own writes
   * set it optimistically from the URL we are about to navigate to, Back sets
   * it from `popstate`, and any other route change re-reads `window.location`
   * once Next has told us the pathname moved.
   */
  const [href, setHref] = useState(() => {
    const query = search?.toString() ?? ""
    return `${pathname ?? BSIM_ROUTES.hub}${query ? `?${query}` : ""}`
  })

  useEffect(() => {
    const sync = () => setHref(window.location.pathname + window.location.search)
    sync()
    window.addEventListener("popstate", sync)
    return () => window.removeEventListener("popstate", sync)
  }, [pathname, search])

  const [path, query = ""] = href.split("?")
  const { screen, params } = matchBsimRoute(path)
  // Query params last, flattened into the same bag: the package addresses
  // `tab`, `team`, `source` and `format` exactly like path params.
  for (const [key, value] of new URLSearchParams(query).entries()) params[key] = value

  // `replace` has to be the router's, not history.replaceState: Next owns the
  // segment tree, and a raw history call leaves it rendering the old route.
  // scroll:false because these are in-place state changes (a hub tab, an open
  // team, which battle you are looking at), not page changes.
  const navigate = useCallback(
    (route: string, opts?: { replace?: boolean }) => {
      setHref(route)
      if (opts?.replace) router.replace(route, { scroll: false })
      else router.push(route)
    },
    [router],
  )
  const nav = useHashBsimNav(screen, params, navigate)

  return <BsimRoot nav={nav} />
}

export { BSIM_ROUTES }
