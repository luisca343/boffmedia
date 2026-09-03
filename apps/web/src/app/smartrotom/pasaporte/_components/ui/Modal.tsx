// DESK. The sheet is chrome, not a page: navy-black card, gold hairline, chrome type.

"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
import { Icon } from "./Icon"
import { PS_SCOPE } from "./ThemedLayer"

export interface OverlayProps {
  onClose: () => void
  children: ReactNode
  className?: string
  /** Accessible name — the scrim has no natural title of its own. */
  label?: string
}

/**
 * The bare scrim, kept exported for parity with the barrel (unused internally beyond
 * `Modal` below). A skin over the shared `ModalShell`.
 */
export function Overlay({ onClose, children, className, label }: OverlayProps) {
  const t = useTranslations("pasaporte")
  return (
    <ModalShell
      onClose={onClose}
      label={label ?? t("modal.dialog")}
      scope={PS_SCOPE}
      scrimClassName={cn(
        "z-[80] flex items-center justify-center p-5",
        "bg-[rgb(3_5_15_/_.78)] backdrop-blur-[4px]",
        "animate-ps-fade motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </ModalShell>
  )
}

/**
 * The replay sheet. Focus trap, focus restore, Escape, scrim dismiss, scroll lock and
 * dialog semantics all come from the shared `ModalShell` now — a modal whose focus can
 * wander behind the scrim is a modal only to the sighted.
 */
export function Modal({
  title,
  onClose,
  children,
  className,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const t = useTranslations("pasaporte")
  return (
    <ModalShell
      onClose={onClose}
      label={title}
      scope={PS_SCOPE}
      scrimClassName="z-[80] flex items-center justify-center p-5 bg-[rgb(3_5_15_/_.78)] backdrop-blur-[4px] animate-ps-fade motion-reduce:animate-none"
      className={cn(
        "relative max-h-[88vh] w-[min(45rem,92vw)] overflow-hidden overflow-y-auto ps-scroll",
        "rounded-2xl border border-ps-gild/18 bg-ps-desk-lo shadow-[0_25px_50px_-12px_rgba(0,0,0,.5)]",
        "animate-ps-sheet-in motion-reduce:animate-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ps-gild/18 px-[1.125rem] py-3.5">
        <h2 className="font-ps-display text-[0.9375rem] font-bold tracking-[.06em] text-ps-chrome-fg">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("modal.close")}
          className="grid h-[1.875rem] w-[1.875rem] place-items-center rounded-lg text-ps-chrome-muted transition-colors hover:bg-white/[.06] hover:text-ps-chrome-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild"
        >
          <Icon name="x" className="h-[1.125rem] w-[1.125rem]" />
        </button>
      </div>
      {children}
    </ModalShell>
  )
}
