"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast"
import { ThemedLayer } from "./Modal"

export { toast }

/**
 * The host portals to `document.body`, so it is wrapped in `ThemedLayer` — outside
 * `.wp-app` every `wp-*` var is undefined and the pill would render unthemed.
 */

const DOT: Record<ToastKind, string> = {
  info: "bg-wp-accent shadow-[0_0_8px_rgb(var(--wp-accent))]",
  success: "bg-wp-green shadow-[0_0_8px_rgb(var(--wp-green))]",
  warn: "bg-wp-rose shadow-[0_0_8px_rgb(var(--wp-rose))]",
  error: "bg-wp-rose shadow-[0_0_8px_rgb(var(--wp-rose))]",
}

export function ToastHost() {
  const toasts = useToasts()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <ThemedLayer>
      <div
        // aria-live, not role=alert: these are confirmations, and a screen reader
        // should hear them without having focus yanked out of the flow.
        aria-live="polite"
        className="pointer-events-none fixed left-1/2 top-4 z-[200] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "wp-glass flex items-center gap-2.5 rounded-wp-pill border-wp-line/46 py-2.5 pl-3.5 pr-4 shadow-wp",
              "animate-wp-pop motion-reduce:animate-none",
            )}
          >
            <span className={cn("h-2 w-2 flex-none rounded-wp-pill", DOT[t.kind])} />
            <span className="font-wp text-[13.5px] font-semibold text-wp-fg">{t.msg}</span>
          </div>
        ))}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
