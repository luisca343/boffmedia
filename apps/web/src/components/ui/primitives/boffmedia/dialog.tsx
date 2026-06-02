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
  const sizeClasses = { sm: "k-modal--sm", md: "k-modal--md", lg: "k-modal--lg" }

  return (
    <>
      {React.cloneElement(trigger, { onClick: () => setOpen(true) } as React.HTMLAttributes<HTMLElement>)}
      {open && (
        <div className="k-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
          <div className={cn("k-modal", sizeClasses[size])} role="dialog" aria-modal="true" aria-label={title || undefined}>
            <button className="k-modal__x" aria-label="Cerrar" onClick={close}><Icon name="x" size={16} /></button>
            {(title || description) && (
              <div className="k-modal__head">
                {title && <h3 className="k-modal__title">{title}</h3>}
                {description && <p className="k-modal__desc">{description}</p>}
              </div>
            )}
            <div className="k-modal__body">{typeof children === "function" ? children(close) : children}</div>
            {footer && <div className="k-modal__foot">{typeof footer === "function" ? footer(close) : footer}</div>}
          </div>
        </div>
      )}
    </>
  )
}
