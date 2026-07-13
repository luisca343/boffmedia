"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { ThemedLayer } from "./ThemedLayer"

/**
 * The compose dialog's shell, and every other overlay in Rooker.
 *
 * Portaled to `document.body` so it escapes the timeline's `overflow: hidden` and its
 * stacking context — and therefore re-themed through `ThemedLayer`, or every `rk-*`
 * token inside it would resolve to nothing (§2).
 *
 * Escape closes, the backdrop closes, the panel does not; and the body is locked while
 * it is open so the timeline behind cannot scroll away under the dialog.
 */
export interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, label, children, className }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  // `document` does not exist during SSR, so the portal can only be created after mount.
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <ThemedLayer>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={onClose}
        className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-3 pb-3 pt-[5%] backdrop-blur-sm"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-[560px] animate-rk-fadeup overflow-hidden rounded-rk border border-rk-line-strong",
            "bg-rk-bg shadow-[0_30px_80px_-20px_rgb(0_0_0/.8)] motion-reduce:animate-none",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </ThemedLayer>,
    document.body,
  )
}
