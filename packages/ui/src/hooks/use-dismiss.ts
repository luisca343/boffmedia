"use client"

import * as React from "react"

/**
 * Dismiss-on-outside-click + Escape for popovers/menus. Listeners are only
 * attached while `active` is true. `onDismiss` also receives the trigger kind
 * so callers can e.g. restore focus only on Escape.
 *
 * `extraRef` is for a floating layer rendered in a PORTAL (a menu popup that
 * escapes an ancestor's clip-path/overflow): it lives outside `ref` in the DOM,
 * so a click inside it would otherwise read as "outside" and close the popup
 * before the item's own click could fire. Clicks inside either ref are ignored.
 */
export function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  onDismiss: (reason: "outside" | "escape") => void,
  active: boolean,
  extraRef?: React.RefObject<HTMLElement | null>,
) {
  const cb = React.useRef(onDismiss)
  cb.current = onDismiss

  React.useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (extraRef?.current?.contains(target)) return
      cb.current("outside")
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb.current("escape")
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [active, ref, extraRef])
}
