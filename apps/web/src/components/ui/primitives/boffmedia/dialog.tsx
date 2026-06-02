"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./icon"

interface BoffModalProps {
  trigger: React.ReactElement
  title?: string | null
  description?: string
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  size?: "sm" | "md" | "lg"
}

const sizeClasses = { sm: "max-w-[420px]", md: "max-w-[540px]", lg: "max-w-[720px]" }

export function BoffModal({ trigger, title, description, children, footer, size = "md" }: BoffModalProps) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey) }
  }, [open])
  const close = () => setOpen(false)

  return (
    <>
      {React.cloneElement(trigger, { onClick: () => setOpen(true) } as React.HTMLAttributes<HTMLElement>)}
      {open && (
        <div
          className="fixed inset-0 z-[160] grid place-items-center p-6 bg-[color-mix(in_srgb,var(--bg)_64%,rgba(0,0,0,0.6))] backdrop-blur-[6px] animate-k-fade"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            className={cn(
              "relative w-full",
              "bg-[var(--surface)]",
              "border border-solid border-[var(--border-strong)]",
              "rounded-[var(--radius-lg,22px)]",
              "shadow-[0_40px_90px_-30px_var(--shadow-color)]",
              "p-7",
              "animate-k-modal-in",
              "max-h-[88vh] overflow-y-auto",
              "data-[direction=hud]:shadow-[8px_8px_0_0_var(--hud-shadow)]",
              sizeClasses[size],
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title || undefined}
          >
            <button
              className="absolute top-4 right-4 grid place-items-center w-8 h-8 border-0 rounded-[var(--radius,14px)] bg-[var(--surface-2)] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
              aria-label="Cerrar"
              onClick={close}
            >
              <Icon name="x" size={16} />
            </button>
            {(title || description) && (
              <div className="mb-5 pr-8">
                {title && <h3 className="text-2xl">{title}</h3>}
                {description && <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{description}</p>}
              </div>
            )}
            <div>{typeof children === "function" ? children(close) : children}</div>
            {footer && (
              <div className="flex gap-3 justify-end mt-6 pt-5 border-t-[var(--hairline,1px)] border-solid border-t-[var(--border)]">
                {typeof footer === "function" ? footer(close) : footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
