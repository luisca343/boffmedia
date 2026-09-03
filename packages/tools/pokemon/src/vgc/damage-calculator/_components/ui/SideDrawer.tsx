"use client"

import * as React from "react"
import { useVgcT } from "../../../i18n";
import { Icon, type IconName } from "@boffmedia/ui"

// right-side drawer (saved teams, edit slot). Esc closes.
export function SideDrawer({
  title,
  icon,
  onClose,
  closeLabel,
  children,
}: {
  title: string
  icon?: IconName
  onClose: () => void
  closeLabel?: string
  children: React.ReactNode
}) {
  const t = useVgcT("calc.ui")
  const resolvedCloseLabel = closeLabel ?? t("close")

  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 top-[var(--tool-sticky-top,0px)] z-[74] bg-transparent" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={title}
        className="fixed bottom-0 right-0 top-[var(--tool-sticky-top,0px)] z-[75] flex w-[min(25rem,94vw)] flex-col border-l border-solid border-line-2 bg-panel shadow-[var(--shadow)] animate-[bm-drawer-in_0.22s_cubic-bezier(0.2,0.7,0.3,1)] motion-reduce:animate-none"
      >
        <div className="flex flex-none items-center gap-[0.625rem] border-b border-solid border-line px-[1.125rem] py-[0.875rem] font-display text-[1rem]/none font-bold uppercase tracking-[0.04em]">
          {icon && <Icon name={icon} size={17} />}
          <span>{title}</span>
          <button
            type="button"
            aria-label={resolvedCloseLabel}
            onClick={onClose}
            className="ml-auto grid h-[2.125rem] w-[2.125rem] place-items-center text-txt-muted transition-colors hover:text-txt"
          >
            <Icon name="x" size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-[1.125rem] py-4">{children}</div>
      </aside>
    </>
  )
}
