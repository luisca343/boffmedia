"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { dismissToast, toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast"
import { Icon, type IconName } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"
import { TONES, type Tone } from "../../_utils/tones"

export { toast }

/**
 * The shared bus only carries four kinds, so the free-form `(tone, icon)` pair every
 * call site used to pick is now a fixed lookup per kind — in practice every call site
 * only ever used "ok"/"check" or "danger"/"alert", so nothing here actually changes
 * pixel for pixel.
 */
const KIND: Record<ToastKind, { tone: Tone; icon: IconName }> = {
  success: { tone: "ok", icon: "check" },
  info: { tone: "info", icon: "bell" },
  warn: { tone: "warn", icon: "alert" },
  error: { tone: "danger", icon: "alert" },
}

export function ToastHost() {
  const toasts = useToasts()
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
          const { tone, icon } = KIND[t.kind]
          const style = TONES[tone]
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => dismissToast(t.id)}
              className="gt-spine pointer-events-auto flex animate-gt-toast items-center gap-2.5 rounded-gt border border-gt-line-strong bg-gt-paper-0 py-2.5 pl-4 pr-3.5 text-left text-[13px] font-medium text-gt-ink-800 shadow-gt-lg motion-reduce:animate-none"
              style={{ ["--gt-dep" as string]: style.css }}
            >
              <Icon name={icon} size={16} className={`flex-none ${style.text}`} />
              <span>{t.msg}</span>
            </button>
          )
        })}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
