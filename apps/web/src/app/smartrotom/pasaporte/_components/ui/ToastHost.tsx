// DESK. Toasts float over the walnut, below the book — chrome type on a dark card.

"use client"

import { useEffect, useState } from "react"
import { toast, useToasts } from "@/components/smartrotom/behavior/toast"

export { toast }

/**
 * The card only ever had one visual style, regardless of kind, so `t.kind` is not
 * consulted here — every call site (all of them plain single-argument `toast(msg)`)
 * renders pixel-identical to before.
 */
export function ToastHost() {
  const toasts = useToasts()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      // aria-live, not role=alert: these are confirmations and must not steal focus.
      aria-live="polite"
      className="pointer-events-none fixed bottom-[5.25rem] left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 rounded-xl border border-ps-gild/18 bg-ps-desk px-[1.125rem] py-[0.6875rem] shadow-[0_8px_26px_rgba(20,14,8,.4)] animate-ps-toast-in motion-reduce:animate-none"
        >
          <span className="h-[0.5625rem] w-[0.5625rem] flex-none rounded-full bg-ps-olive shadow-[0_0_10px_rgb(var(--ps-olive))]" />
          <span className="font-ps text-[0.8125rem] text-ps-chrome-fg">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
