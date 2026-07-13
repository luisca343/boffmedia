"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ThemedLayer } from "./Modal"

/**
 * Toasts. Fired imperatively from anywhere (`toast("Añadido", "success")`) via a
 * DOM CustomEvent rather than a store, so a mutation's `onSuccess` can raise one
 * without the call site needing to be inside a provider.
 *
 * The host portals to `document.body`, so it is wrapped in `ThemedLayer` — outside
 * `.wp-app` every `wp-*` var is undefined and the pill would render unthemed (§2).
 */

type ToastKind = "info" | "success" | "error"
interface ToastMsg {
  id: string
  msg: string
  kind: ToastKind
}

const EVENT = "wp-toast"

export function toast(msg: string, kind: ToastKind = "info", duration = 2600) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { msg, kind, duration } }))
}

const DOT: Record<ToastKind, string> = {
  info: "bg-wp-accent shadow-[0_0_8px_rgb(var(--wp-accent))]",
  success: "bg-wp-green shadow-[0_0_8px_rgb(var(--wp-green))]",
  error: "bg-wp-rose shadow-[0_0_8px_rgb(var(--wp-rose))]",
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onToast = (e: Event) => {
      const { msg, kind, duration } = (e as CustomEvent).detail
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, msg, kind }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
    }
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])

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
