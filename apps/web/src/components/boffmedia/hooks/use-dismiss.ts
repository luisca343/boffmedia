"use client"

import * as React from "react"

/**
 * Dismiss-on-outside-click + Escape for popovers/menus. Listeners are only
 * attached while `active` is true. `onDismiss` also receives the trigger kind
 * so callers can e.g. restore focus only on Escape.
 */
export function useDismiss(
  ref: React.RefObject<HTMLElement | null>,
  onDismiss: (reason: "outside" | "escape") => void,
  active: boolean,
) {
  const cb = React.useRef(onDismiss)
  cb.current = onDismiss

  React.useEffect(() => {
    if (!active) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current("outside")
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
  }, [active, ref])
}
