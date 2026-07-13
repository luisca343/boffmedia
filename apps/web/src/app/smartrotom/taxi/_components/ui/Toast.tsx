"use client"

import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { toast, useToasts, type ToastKind } from "@/components/smartrotom/behavior/toast"
import { Icon, type IconName } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"

export { toast }

/** No call site overrides the icon in practice, so each kind gets one fixed glyph. */
const KIND_ICON: Record<ToastKind, IconName> = {
  info: "spark",
  success: "check",
  warn: "wallet",
  error: "wallet",
}

// `info` wears its icon bare in the accent; the two outcome tones put it in a filled
// disc, so a completed trip or a refused payment reads at a glance.
const TONES: Record<ToastKind, { wrap: string; badge?: string }> = {
  info: { wrap: "border-tx-line-2 text-tx-accent" },
  success: { wrap: "border-tx-ok", badge: "bg-tx-ok text-[#042a1c]" },
  warn: { wrap: "border-tx-no", badge: "bg-tx-no text-white" },
  error: { wrap: "border-tx-no", badge: "bg-tx-no text-white" },
}

/** Mount once, at the app root. Portaled, so it carries its own themed layer. */
export function ToastHost() {
  const list = useToasts()

  if (typeof document === "undefined" || list.length === 0) return null

  return createPortal(
    <ThemedLayer>
      <div className="fixed left-1/2 top-[74px] z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
        {list.map((t) => {
          const icon = KIND_ICON[t.kind]
          const tone = TONES[t.kind]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                "flex items-center gap-2.5 rounded-tx-pill py-2.5 pl-3 pr-5",
                "bg-tx-surface-solid border border-solid shadow-tx-2",
                "text-[13.5px] font-bold text-tx-txt",
                "animate-tx-toast-in motion-reduce:animate-none",
                tone.wrap,
              )}
            >
              {tone.badge ? (
                <span className={cn("grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full", tone.badge)}>
                  <Icon name={icon} size={18} stroke={2.6} />
                </span>
              ) : (
                <Icon name={icon} size={15} stroke={2.2} />
              )}
              <span className="text-tx-txt">{t.msg}</span>
            </div>
          )
        })}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
