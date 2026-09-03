"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
import { RK_SCOPE } from "./ThemedLayer"

/**
 * The compose dialog's shell, and every other overlay in Rooker.
 *
 * A skin over the shared `ModalShell`: portal, Escape, scrim dismiss, scroll lock,
 * focus trap/restore and dialog semantics all come from there.
 */
export interface ModalProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, label, children, className }: ModalProps) {
  if (!open) return null

  return (
    <ModalShell
      onClose={onClose}
      label={label}
      scope={RK_SCOPE}
      scrimClassName="z-[200] flex items-start justify-center bg-black/70 px-3 pb-3 pt-[5%] backdrop-blur-sm"
      className={cn(
        "w-full max-w-[35rem] animate-rk-fadeup overflow-hidden rounded-rk border border-rk-line-strong",
        "bg-rk-bg shadow-[0_30px_80px_-20px_rgb(0_0_0/.8)] motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </ModalShell>
  )
}
