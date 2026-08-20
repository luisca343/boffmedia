"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
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

/** The arcade's scope-root classes, for the shared `ModalShell`'s portal. */
export const AR_SCOPE = "ar-app font-ar text-ar-ink"

const SIZE = { sm: "max-w-[420px]", md: "max-w-[560px]", lg: "max-w-[760px]" } as const

const TONE = {
  cyan: "border-ar-cyan/40 shadow-[0_0_60px_-12px_rgb(var(--ar-cyan)/.45)]",
  magenta: "border-ar-magenta/40 shadow-[0_0_60px_-12px_rgb(var(--ar-magenta)/.45)]",
  danger: "border-ar-danger/50 shadow-[0_0_60px_-12px_rgb(var(--ar-danger)/.45)]",
} as const

/**
 * The arcade's only dialog — a skin over the shared `ModalShell`. Portal, Escape, scrim
 * dismiss, scroll lock, focus trap/restore and dialog semantics all come from there;
 * this file only owns the CRT skin.
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
  const t = useTranslations("arcade")
  if (!open) return null

  return (
    <ModalShell
      onClose={onClose}
      label={typeof title === "string" ? title : t("common.dialog")}
      scope={AR_SCOPE}
      scrimClassName="z-[200] grid place-items-center bg-[rgb(4_2_14/.78)] p-4 backdrop-blur-md"
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
          aria-label={t("common.close")}
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
    </ModalShell>
  )
}
