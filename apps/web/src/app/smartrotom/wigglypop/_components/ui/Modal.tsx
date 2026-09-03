"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
import { ThemedLayer as SharedThemedLayer } from "@/components/smartrotom/behavior/ThemedLayer"
import { Button } from "./Button"
import { Icon } from "./Icon"

/** The `.wp-app` scope-root class, for the shared `ModalShell`'s portal. */
export const WP_SCOPE = "wp-app"

/** Thin wrapper so existing deep imports (`Toast.tsx`) keep working unchanged. */
export function ThemedLayer({ children }: { children: ReactNode }) {
  return <SharedThemedLayer scope={WP_SCOPE}>{children}</SharedThemedLayer>
}

export interface OverlayProps {
  onClose: () => void
  children: ReactNode
  className?: string
  /** Accessible name — the bare scrim has no natural title of its own. */
  label?: string
}

/**
 * The bare scrim, kept exported for parity with the barrel (unused internally beyond
 * `Modal` below). A skin over the shared `ModalShell`.
 */
export function Overlay({ onClose, children, className, label }: OverlayProps) {
  const t = useTranslations("wigglypop")
  return (
    <ModalShell
      onClose={onClose}
      label={label ?? t("modal.common.defaultLabel")}
      scope={WP_SCOPE}
      scrimClassName={cn(
        "z-[80] flex items-center justify-center p-5",
        "bg-wp-fg/[.34] backdrop-blur-[5px]",
        "animate-wp-fade motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </ModalShell>
  )
}

/** The modal card. Pops in with the overshoot — same signature as the buttons. */
export function Modal({
  onClose,
  children,
  className,
  label,
}: {
  onClose: () => void
  children: ReactNode
  className?: string
  label?: string
}) {
  const t = useTranslations("wigglypop")
  return (
    <ModalShell
      onClose={onClose}
      label={label ?? t("modal.common.defaultLabel")}
      scope={WP_SCOPE}
      scrimClassName="z-[80] flex items-center justify-center p-5 bg-wp-fg/[.34] backdrop-blur-[5px] animate-wp-fade motion-reduce:animate-none"
      className={cn(
        "wp-noscroll max-h-[88vh] w-[min(32.5rem,94vw)] overflow-y-auto",
        "rounded-wp-lg border-wp border-wp-line/46 bg-white shadow-wp-modal",
        "animate-wp-pop motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </ModalShell>
  )
}

export function ModalHead({
  title,
  sub,
  onClose,
}: {
  title: string
  sub?: ReactNode
  onClose: () => void
}) {
  const t = useTranslations("wigglypop")
  return (
    <div className="flex items-start gap-3 border-b border-wp-line/24 px-5 pb-3.5 pt-[1.125rem]">
      <div className="flex-1">
        <h2 className="font-wp-display text-[1.1875rem] font-semibold text-wp-fg">{title}</h2>
        {sub && <p className="mt-1 font-wp text-[0.78125rem] font-semibold text-wp-fg-subtle">{sub}</p>}
      </div>
      <Button variant="ghost" iconOnly onClick={onClose} aria-label={t("common.close")}>
        <Icon name="x" size={18} />
      </Button>
    </div>
  )
}

/** The green success panel every completed flow lands on. */
export function ModalDone({
  title,
  children,
  actions,
}: {
  title: string
  children: ReactNode
  actions: ReactNode
}) {
  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-wp-pill border border-wp-green/40 bg-wp-green/[.16]">
        <Icon name="check" size={32} stroke={2.5} className="text-wp-green" />
      </div>
      <h2 className="font-wp-display text-[1.375rem] font-semibold text-wp-fg">{title}</h2>
      <p className="mt-2 font-wp text-[0.84375rem] font-semibold leading-relaxed text-wp-fg-muted">
        {children}
      </p>
      <div className="mt-6 flex justify-center gap-2.5">{actions}</div>
    </div>
  )
}
