"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { toast, useToasts } from "@/components/smartrotom/behavior/toast"
import { ThemedLayer } from "./ThemedLayer"
import { RookerMark } from "@/lib/smartrotom/customIcons"

export { toast }

/**
 * The accent capsule that confirms an action — "Tu trino se publicó en el nido."
 *
 * Only the most recent toast ever showed at once (a later one replaced it rather than
 * queuing beside it), so this only renders the tail of the shared queue.
 */
export function ToastHost() {
  const toasts = useToasts()
  const message = toasts[toasts.length - 1]
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted || !message) return null

  return createPortal(
    <ThemedLayer>
      <div
        // Polite, not assertive: a confirmation must not interrupt a screen reader
        // mid-sentence.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-7 left-1/2 z-[300] flex -translate-x-1/2 animate-rk-fadeup items-center gap-2.5 whitespace-nowrap rounded-rk-pill bg-rk-accent px-5 py-3 text-[14.5px] font-semibold text-rk-accent-fg shadow-[0_14px_36px_-8px_rgb(0_0_0/.45)] motion-reduce:animate-none"
      >
        <RookerMark size={20} className="text-rk-accent-fg" />
        {message.msg}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
