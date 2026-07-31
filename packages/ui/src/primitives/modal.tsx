"use client"

import * as React from "react"
import { cn } from "../cn"
import { useT } from "../i18n"
import { Icon } from "./icon"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: React.ReactNode
  aside?: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "lg"
  className?: string
  bodyClassName?: string
  children?: React.ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, aside, footer, size, className, bodyClassName, children }: ModalProps) {
  const t = useT()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()

  // Callers pass an inline arrow for onClose, so keeping it out of the effect deps
  // is what stops every parent re-render from re-running the effect and stealing focus.
  const onCloseRef = React.useRef(onClose)
  onCloseRef.current = onClose

  React.useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === "Tab") {
        const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
        if (!nodes?.length) return
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    // items-start + my-auto on the panel centers short modals but top-aligns tall ones;
    // place-items-center pushes a taller-than-viewport panel above the scroll origin, unreachable.
    <div
      className="fixed inset-0 z-[920] flex justify-center items-start overflow-y-auto bg-[var(--scrim)] p-6 animate-[k-fade_0.2s_ease-out] motion-reduce:animate-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full my-auto flex flex-col max-h-[calc(100dvh-3rem)] bg-panel border border-solid border-line-2 outline-none cut-corner",
          "animate-[bm-modal-in_0.26s_cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:animate-none",
          size === "sm" ? "max-w-[440px]" : size === "lg" ? "max-w-[760px]" : "max-w-[580px]",
          className,
        )}
        style={{ boxShadow: "0 1px 0 var(--accent-line), 0 32px 80px -24px rgba(0,0,0,0.75)" }}
      >
        <header className="shrink-0 flex items-center gap-3 py-[14px] pl-5 pr-[14px] border-b border-solid border-line">
          {title && (
            <h3 id={titleId} className="font-display text-[16px] font-bold not-italic uppercase leading-none tracking-[0.04em]">
              {title}
            </h3>
          )}
          <span className="ml-auto flex items-center gap-2">
            {aside}
            <button
              type="button"
              aria-label={t("close")}
              onClick={onClose}
              className="grid place-items-center w-[26px] h-[26px] p-0 border-0 bg-transparent text-txt-dim cursor-pointer hover:text-txt transition-colors"
            >
              <Icon name="x" size={15} />
            </button>
          </span>
        </header>
        <div className={cn("min-h-0 overflow-y-auto p-5", bodyClassName)}>{children}</div>
        {footer && (
          <footer className="shrink-0 flex items-center justify-end gap-2.5 py-[14px] px-5 border-t border-solid border-line">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
