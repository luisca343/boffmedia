"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { create } from "zustand"
import { Icon, type IconName } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"
import { TONES, type Tone } from "../../_utils/tones"

type Toast = { id: number; msg: string; tone: Tone; icon?: IconName }

type ToastStore = {
  toasts: Toast[]
  push: (msg: string, tone?: Tone, icon?: IconName) => void
  dismiss: (id: number) => void
}

let nextId = 0

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (msg, tone = "civic", icon) => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone, icon }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

/** Fire a toast from anywhere — including outside React. */
export const toast = (msg: string, tone: Tone = "civic", icon?: IconName) =>
  useToastStore.getState().push(msg, tone, icon)

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <ThemedLayer>
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone]
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => dismiss(t.id)}
              className={`gt-spine pointer-events-auto flex animate-gt-toast items-center gap-2.5 rounded-gt border border-gt-line-strong bg-gt-paper-0 py-2.5 pl-4 pr-3.5 text-left text-[13px] font-medium text-gt-ink-800 shadow-gt-lg motion-reduce:animate-none`}
              style={{ ["--gt-dep" as string]: tone.css }}
            >
              {t.icon && <Icon name={t.icon} size={16} className={`flex-none ${tone.text}`} />}
              <span>{t.msg}</span>
            </button>
          )
        })}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
