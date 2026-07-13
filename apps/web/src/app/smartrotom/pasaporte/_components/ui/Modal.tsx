// DESK. The sheet is chrome, not a page: navy-black card, gold hairline, chrome type.

"use client"

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Overlay({
  onClose,
  children,
  className,
}: {
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    // Portaled content escapes `.ps-app`; without this wrapper every `ps-*` var in the
    // sheet resolves to nothing (SMARTROTOM_V3.md §2).
    <ThemedLayer>
      <div
        // mousedown, not click: a drag that starts inside the sheet and ends on the scrim
        // would otherwise close it.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        className={cn(
          "fixed inset-0 z-[80] flex items-center justify-center p-5",
          "bg-[rgb(3_5_15_/_.78)] backdrop-blur-[4px]",
          "animate-ps-fade motion-reduce:animate-none",
          className,
        )}
      >
        {children}
      </div>
    </ThemedLayer>,
    document.body,
  )
}

/**
 * The replay sheet. Traps Tab inside itself while open — a modal whose focus can wander
 * behind the scrim is a modal only to the sighted.
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
  const sheet = useRef<HTMLDivElement>(null)

  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !sheet.current) return
    const items = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && active === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    sheet.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => opener?.focus?.()
  }, [])

  return (
    <Overlay onClose={onClose}>
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
        className={cn(
          "relative max-h-[88vh] w-[min(720px,92vw)] overflow-hidden overflow-y-auto ps-scroll",
          "rounded-2xl border border-ps-gild/18 bg-ps-desk-lo shadow-[0_25px_50px_-12px_rgba(0,0,0,.5)]",
          "animate-ps-sheet-in motion-reduce:animate-none",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-ps-gild/18 px-[18px] py-3.5">
          <h2 className="font-ps-display text-[15px] font-bold tracking-[.06em] text-ps-chrome-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-[30px] w-[30px] place-items-center rounded-lg text-ps-chrome-muted transition-colors hover:bg-white/[.06] hover:text-ps-chrome-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-gild"
          >
            <Icon name="x" className="h-[18px] w-[18px]" />
          </button>
        </div>
        {children}
      </div>
    </Overlay>
  )
}
