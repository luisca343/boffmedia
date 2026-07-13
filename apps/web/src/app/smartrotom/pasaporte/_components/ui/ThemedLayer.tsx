// DESK (infrastructure). Everything portaled in this app — the replay sheet, the toasts
// — is desk chrome, and this is what makes it themeable at all.

"use client"

import { useEffect, useState, type ReactNode } from "react"

/**
 * Re-applies `.ps-app` to portaled content.
 *
 * A portal lands on `document.body`, outside the app root — and every `ps-*` token is a
 * CSS var declared ON that root, so a modal rendered through `createPortal` comes out
 * with no paper, no ink and no foil (SMARTROTOM_V3.md §2). `display: contents` re-declares
 * the vars without adding a box to the layout.
 *
 * The two `data-*` attributes are DOCUMENT properties (how loud the security print is,
 * whether the ambience loops), and they must ride along or a portaled surface would
 * ignore the reader's choices. Rather than couple this primitive to a store, it mirrors
 * whatever the live app root says — and keeps mirroring it, so flipping ornament while a
 * sheet is open updates the sheet too.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  const [ornament, setOrnament] = useState("tasteful")
  const [motion, setMotion] = useState("on")

  useEffect(() => {
    // `:not([data-portal])` excludes the layers this component itself mounts into body.
    const root = document.querySelector<HTMLElement>(".ps-app:not([data-portal])")
    if (!root) return

    const sync = () => {
      setOrnament(root.dataset.ornament ?? "tasteful")
      setMotion(root.dataset.motion ?? "on")
    }
    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["data-ornament", "data-motion"] })
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className="ps-app contents font-ps text-ps-chrome-fg"
      data-portal=""
      data-ornament={ornament}
      data-motion={motion}
    >
      {children}
    </div>
  )
}
