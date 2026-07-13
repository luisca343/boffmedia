// DESK. Toasts float over the walnut, below the book — chrome type on a dark card.

"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ThemedLayer } from "./ThemedLayer"

/**
 * Fired imperatively from anywhere (`toast("Sellado")`) through a DOM CustomEvent rather
 * than a store, so any handler can raise one without being inside a provider.
 *
 * The host portals to `document.body` and is therefore wrapped in `ThemedLayer` — outside
 * `.ps-app` every `ps-*` var is undefined and the card renders unthemed (§2).
 */
const EVENT = "ps-toast"

interface ToastMsg {
  id: string
  msg: string
}

export function toast(msg: string, duration = 2600) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { msg, duration } }))
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onToast = (e: Event) => {
      const { msg, duration } = (e as CustomEvent).detail as { msg: string; duration: number }
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, msg }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
    }
    window.addEventListener(EVENT, onToast)
    return () => window.removeEventListener(EVENT, onToast)
  }, [])

  if (!mounted) return null

  return createPortal(
    <ThemedLayer>
      <div
        // aria-live, not role=alert: these are confirmations and must not steal focus.
        aria-live="polite"
        className="pointer-events-none fixed bottom-[84px] left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 rounded-xl border border-ps-gild/18 bg-ps-desk px-[18px] py-[11px] shadow-[0_8px_26px_rgba(20,14,8,.4)] animate-ps-toast-in motion-reduce:animate-none"
          >
            <span className="h-[9px] w-[9px] flex-none rounded-full bg-ps-olive shadow-[0_0_10px_rgb(var(--ps-olive))]" />
            <span className="font-ps text-[13px] text-ps-chrome-fg">{t.msg}</span>
          </div>
        ))}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
