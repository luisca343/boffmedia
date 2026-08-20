"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
import { Icon } from "./Icon"
import { GT_SCOPE } from "./ThemedLayer"

/**
 * A skin over the shared `ModalShell` — portal, Escape, scrim dismiss, scroll lock,
 * focus trap/restore and dialog semantics all come from there.
 */
export function Modal({
  open,
  onClose,
  title,
  kicker,
  children,
  footer,
  width = 560,
}: {
  open: boolean
  onClose: () => void
  title: string
  kicker?: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}) {
  const t = useTranslations("gobierno")

  if (!open) return null

  return (
    <ModalShell
      onClose={onClose}
      label={title}
      scope={GT_SCOPE}
      scrimClassName="z-[100] flex items-center justify-center p-4"
    >
      <div
        style={{ maxWidth: width }}
        className="gt-edge-gold relative flex max-h-[85vh] w-full animate-gt-pop-scale flex-col overflow-hidden rounded-gt border border-gt-line-strong bg-gt-paper-0 shadow-gt-lg motion-reduce:animate-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gt-line px-5 pb-3.5 pt-4">
          <div className="min-w-0">
            {kicker && (
              <div className="mb-1 font-gt-mono text-[9.5px] font-bold uppercase tracking-[.18em] text-gt-ink-400">
                {kicker}
              </div>
            )}
            <h2 className="font-gt-display text-[19px] leading-tight text-gt-ink-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="-mr-1 -mt-1 rounded-gt-sm p-1.5 text-gt-ink-400 transition-colors hover:bg-gt-paper-2 hover:text-gt-ink-900"
          >
            <Icon name="x" size={17} />
          </button>
        </div>

        <div className="gt-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-gt-line bg-gt-paper-1 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </ModalShell>
  )
}
