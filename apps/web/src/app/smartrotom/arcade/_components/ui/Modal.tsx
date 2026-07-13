"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Corners } from "./Corners"
import { Icon } from "./Icon"

export interface ArModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  kicker?: string
  children: ReactNode
  footer?: ReactNode
  /** Body scrolls internally past this height, so the dialog never grows off-screen. */
  size?: "sm" | "md" | "lg"
  /** A destructive confirm frames itself in the danger neon instead of cyan. */
  tone?: "cyan" | "magenta" | "danger"
}

const SIZE = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]" } as const

const TONE = {
  cyan: "border-ar-cyan/40 shadow-[0_0_60px_-12px_rgb(var(--ar-cyan)/.45)]",
  magenta: "border-ar-magenta/40 shadow-[0_0_60px_-12px_rgb(var(--ar-magenta)/.45)]",
  danger: "border-ar-danger/50 shadow-[0_0_60px_-12px_rgb(var(--ar-danger)/.45)]",
} as const

/**
 * The arcade's only dialog. Rendered inline rather than through a portal so it
 * stays inside `.ar-app` and its tokens resolve — portaled content would lose
 * them and render unthemed (SMARTROTOM_V3.md §2).
 */
export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  size = "md",
  tone = "cyan",
}: ArModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    panelRef.current?.focus()
    // The page behind must not scroll while a dialog owns the viewport.
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgb(4_2_14/.78)] p-4 backdrop-blur-md"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "ar-scanlines relative w-full overflow-hidden rounded-2xl border outline-none",
          "bg-[linear-gradient(180deg,rgb(20_10_52/.97),rgb(8_4_24/.97))]",
          SIZE[size],
          TONE[tone],
        )}
      >
        <Corners tone={tone === "danger" ? "magenta" : tone} inset={10} size={14} />

        <div className="relative z-[1] flex items-start justify-between gap-4 border-b border-white/[.07] p-5">
          <div>
            {kicker && (
              <div className="mb-2 font-ar-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ar-cyan">
                {kicker}
              </div>
            )}
            <h2 className="font-ar-display text-sm leading-relaxed text-ar-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="ar-lift shrink-0 rounded-md border border-white/10 bg-white/[.04] p-1.5 text-ar-ink-dim hover:text-ar-ink"
          >
            <Icon.X s={14} />
          </button>
        </div>

        <div className="ar-scroll relative z-[1] max-h-[60vh] overflow-y-auto p-5 font-ar text-[13px] leading-relaxed text-ar-ink-dim">
          {children}
        </div>

        {footer && (
          <div className="relative z-[1] flex flex-wrap justify-end gap-2 border-t border-white/[.07] p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
