"use client"

import { useEffect, useState } from "react"

type ToastType = "success" | "error" | "info"
interface ToastItem {
  id: string
  msg: string
  type: ToastType
}

const EVENT = "pc-toast"

/**
 * Fire-and-forget toast. An event rather than a context because it is called from
 * mutation callbacks and keyboard handlers that sit outside the React tree.
 */
export function toast(msg: string, type: ToastType = "info", duration = 2600): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { msg, type, duration } }))
}

/** A literal class per tone — an interpolated `bg-pc-${type}` would never compile. */
const DOT: Record<ToastType, string> = {
  success: "bg-pc-green shadow-[0_0_8px_rgb(var(--pc-green))]",
  error: "bg-pc-rose shadow-[0_0_8px_rgb(var(--pc-rose))]",
  info: "bg-pc-accent shadow-[0_0_8px_rgb(var(--pc-accent))]",
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>()
    const onToast = (e: Event) => {
      const { msg, type, duration } = (e as CustomEvent<{ msg: string; type: ToastType; duration: number }>).detail
      const id = Math.random().toString(36).slice(2)
      setToasts((t) => [...t, { id, msg, type }])
      const timer = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id))
        timers.delete(timer)
      }, duration)
      timers.add(timer)
    }
    window.addEventListener(EVENT, onToast)
    return () => {
      window.removeEventListener(EVENT, onToast)
      for (const t of timers) clearTimeout(t)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-4 z-[200] flex -translate-x-1/2 flex-col items-center gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pc-glass flex animate-pc-pop items-center gap-2.5 rounded-pc-pill border-pc-line-strong py-2.5 pl-[13px] pr-4 font-pc text-[13.5px] font-semibold text-pc-fg shadow-[0_18px_40px_-18px_rgb(0_0_0_/_.7)] motion-reduce:animate-none"
        >
          <span className={`h-2 w-2 flex-none rounded-pc-pill ${DOT[t.type]}`} />
          {t.msg}
        </div>
      ))}
    </div>
  )
}
