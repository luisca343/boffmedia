"use client"

import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Icon } from "./Icon"

/**
 * Re-applies the `.wp-app` scope root to portaled content.
 *
 * A portal escapes the app root, and every `wp-*` token is a CSS var declared ON
 * that root — so a modal rendered into `document.body` would come out completely
 * unthemed (SMARTROTOM_V3.md §2). `display: contents` means the wrapper re-declares
 * the vars without adding a box to the layout. Reach for this whenever you portal.
 */
export function ThemedLayer({ children }: { children: ReactNode }) {
  return (
    <div className="wp-app" style={{ display: "contents" }}>
      {children}
    </div>
  )
}

export function Overlay({
  onClose,
  children,
  className,
}: {
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  // Escape closes, and the body must not scroll behind the scrim.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <ThemedLayer>
      <div
        role="dialog"
        aria-modal="true"
        // mousedown, not click: a click that STARTS inside the card and ends on the
        // scrim (a sloppy drag while selecting text) would otherwise close the modal.
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
        className={cn(
          "fixed inset-0 z-[80] flex items-center justify-center p-5",
          "bg-wp-fg/[.34] backdrop-blur-[5px]",
          "animate-wp-fade motion-reduce:animate-none",
          className,
        )}
      >
        {children}
      </div>
    </ThemedLayer>,
    document.body,
  )
}

/** The modal card. Pops in with the overshoot — same signature as the buttons. */
export function Modal({
  onClose,
  children,
  className,
}: {
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <Overlay onClose={onClose}>
      <div
        className={cn(
          "wp-noscroll max-h-[88vh] w-[min(520px,94vw)] overflow-y-auto",
          "rounded-wp-lg border-wp border-wp-line/46 bg-white shadow-wp-modal",
          "animate-wp-pop motion-reduce:animate-none",
          className,
        )}
      >
        {children}
      </div>
    </Overlay>
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
  return (
    <div className="flex items-start gap-3 border-b border-wp-line/24 px-5 pb-3.5 pt-[18px]">
      <div className="flex-1">
        <h2 className="font-wp-display text-[19px] font-semibold text-wp-fg">{title}</h2>
        {sub && <p className="mt-1 font-wp text-[12.5px] font-semibold text-wp-fg-subtle">{sub}</p>}
      </div>
      <Button variant="ghost" iconOnly onClick={onClose} aria-label="Cerrar">
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
      <h2 className="font-wp-display text-[22px] font-semibold text-wp-fg">{title}</h2>
      <p className="mt-2 font-wp text-[13.5px] font-semibold leading-relaxed text-wp-fg-muted">
        {children}
      </p>
      <div className="mt-6 flex justify-center gap-2.5">{actions}</div>
    </div>
  )
}
