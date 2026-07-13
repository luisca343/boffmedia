"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { create } from "zustand"
import { ThemedLayer } from "./ThemedLayer"
import { RookerMark } from "./RookerMark"

/**
 * The accent capsule that confirms an action — "Tu trino se publicó en el nido."
 *
 * A store rather than context, so `toast()` can be called from a mutation callback or
 * an event handler without the caller having to be inside a provider.
 */
interface ToastState {
  message: string | null
  show: (message: string) => void
  clear: () => void
}

const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}))

export const toast = (message: string) => useToastStore.getState().show(message)

export function ToastHost() {
  const message = useToastStore((s) => s.message)
  const clear = useToastStore((s) => s.clear)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(clear, 2600)
    return () => clearTimeout(t)
  }, [message, clear])

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
        {message}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
