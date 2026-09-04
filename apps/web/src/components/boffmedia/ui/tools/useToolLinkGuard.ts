"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { hasToolNavGuard, runToolNavGuards } from "@boffmedia/tool-kit"
import type { GameEntry } from "@/data/games"

/**
 * The base path of the tool the current route belongs to — the longest tool
 * `href` this path sits under. Null when the route is not a tool's.
 *
 * This is what separates "moving around inside the tool" from "leaving it",
 * which is the only distinction the guard below cares about (see the comment
 * there). Longest match rather than first: tcgpocket registers four hrefs under
 * one another, and the specific one is the right answer.
 */
export function activeToolBase(game: GameEntry | undefined, pathname: string): string | null {
  if (!game) return null
  let best: string | null = null
  for (const category of game.categories) {
    for (const tool of category.tools) {
      if (pathname !== tool.href && !pathname.startsWith(`${tool.href}/`)) continue
      if (!best || tool.href.length > best.length) best = tool.href
    }
  }
  return best
}

/**
 * Let a tool that is in the middle of something be asked before a link takes
 * the user out of it. Does nothing at all unless the mounted tool registered a
 * guard — see `@boffmedia/tool-kit`'s `useToolNavGuard`, which is where the
 * question is asked and answered.
 *
 * WHY A DOCUMENT LISTENER AND NOT A ROUTER HOOK. The App Router has no
 * `beforeNavigate`, and the links that lose a battle are not the tool's own:
 * they are the site navbar, the tool rail beside it and the footer, all of them
 * rendered outside whatever the tool can wrap. One capture-phase listener sees
 * every anchor on the page regardless of who rendered it, which is exactly the
 * set that matters.
 *
 * CAPTURE PHASE, AND PROPAGATION IS STOPPED rather than merely default-
 * prevented. React attaches its own listeners to the root container, so a
 * capture listener on `document` runs first, and stopping the event there is
 * what keeps `next/link`'s handler from running a client-side navigation we
 * just decided not to do. `preventDefault` alone would rely on Link checking
 * `defaultPrevented`, which is an implementation detail of a dependency rather
 * than a promise to us.
 *
 * The navigation is re-issued by `proceed` — through the router for our own
 * pages, so a confirmed departure is still a client-side navigation and not a
 * full reload.
 */
export function useToolLinkGuard(base: string | null): void {
  const router = useRouter()

  React.useEffect(() => {
    if (!base) return

    const onClick = (event: MouseEvent) => {
      // Someone else already handled it, or the browser is about to open this
      // somewhere else entirely (new tab, middle click, download): either way
      // the current page — and the battle on it — survives.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (!hasToolNavGuard()) return

      const target = event.target
      const anchor = target instanceof Element ? target.closest("a[href]") : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.hasAttribute("download")) return
      if (anchor.target && anchor.target !== "_self") return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      // `mailto:`, `tel:`, and anything else that is not a page.
      if (url.protocol !== "http:" && url.protocol !== "https:") return

      const sameOrigin = url.origin === window.location.origin
      if (sameOrigin) {
        // Still inside the tool: the layout stays mounted, so nothing is lost
        // and there is nothing to ask about.
        if (url.pathname === base || url.pathname.startsWith(`${base}/`)) return
        // Same page, different query or hash — a tab, a filter, an anchor.
        if (url.pathname === window.location.pathname) return
      }

      const proceed = () => {
        if (sameOrigin) router.push(`${url.pathname}${url.search}${url.hash}`)
        else window.location.assign(url.href)
      }

      if (!runToolNavGuards({ href: url.href, external: !sameOrigin }, proceed)) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [base, router])
}
