"use client"

import { useEffect, type ReactNode } from "react"
import { Button } from "./Button"
import { Icon, type IconName } from "./Icon"

export interface OverlayProps {
  onClose: () => void
  children: ReactNode
  /** Where the sheet sits. `right` gives a full-height drawer. */
  align?: "center" | "top" | "right"
  className?: string
}

/**
 * The scrim. Closes on backdrop click and on Escape — every overlay in the app gets
 * both for free, which is why nothing else binds Escape itself.
 */
export function Overlay({ onClose, children, align = "center", className = "" }: OverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const place =
    align === "right"
      ? "justify-end p-0"
      : align === "top"
        ? "items-start justify-center pt-[12vh]"
        : "items-center justify-center p-5"

  return (
    <div
      role="presentation"
      onClick={onClose}
      className={`fixed inset-0 z-[80] flex animate-pc-fade bg-[rgb(4_7_14_/_.62)] backdrop-blur-md motion-reduce:animate-none ${place} ${className}`}
    >
      {children}
    </div>
  )
}

export interface ModalProps {
  onClose: () => void
  title: string
  subtitle?: string
  icon?: IconName
  /** Tone for the icon tile — a literal `text-pc-*` class, never interpolated. */
  tone?: string
  width?: number
  align?: "center" | "top"
  children: ReactNode
  footer?: ReactNode
  headerExtra?: ReactNode
}

export function Modal({
  onClose,
  title,
  subtitle,
  icon,
  tone = "text-pc-accent",
  width = 560,
  align = "center",
  children,
  footer,
  headerExtra,
}: ModalProps) {
  return (
    <Overlay onClose={onClose} align={align}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ width }}
        className="pc-glass flex max-h-[90vh] w-full max-w-[96vw] animate-pc-slide-up flex-col overflow-hidden rounded-pc-lg font-pc text-pc-fg motion-reduce:animate-none"
      >
        <header className="flex flex-none items-center gap-3 border-b border-pc-line px-[18px] py-[15px]">
          {icon && (
            <span
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-pc-line-strong bg-white/5 ${tone}`}
            >
              <Icon name={icon} size={18} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-pc-display text-[17px] font-bold">{title}</h2>
            {subtitle && <p className="truncate text-[11.5px] text-pc-fg-subtle">{subtitle}</p>}
          </div>
          {headerExtra}
          <Button variant="ghost" icon onClick={onClose} aria-label="Cerrar">
            <Icon name="x" size={18} />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>

        {footer && (
          <footer className="flex flex-none items-center gap-2.5 border-t border-pc-line p-3.5">{footer}</footer>
        )}
      </div>
    </Overlay>
  )
}

/**
 * A full-height right-hand drawer — the Pokémon detail. Same scrim, different sheet:
 * it slides in from the edge rather than popping in place.
 */
export function Drawer({
  onClose,
  width = 460,
  children,
  label,
}: {
  onClose: () => void
  width?: number
  children: ReactNode
  label: string
}) {
  return (
    <Overlay onClose={onClose} align="right">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        style={{ width }}
        className="pc-glass flex h-full max-w-full animate-pc-slide-in-right flex-col rounded-none border-l border-pc-line-strong font-pc text-pc-fg shadow-[-20px_0_50px_-20px_rgb(0_0_0_/_.7)] motion-reduce:animate-none"
      >
        {children}
      </div>
    </Overlay>
  )
}
