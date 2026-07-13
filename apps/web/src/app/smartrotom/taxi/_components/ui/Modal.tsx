"use client"

import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"
import { ThemedLayer } from "./ThemedLayer"

/**
 * The taxi's one overlay shape: a bottom sheet on a phone, a centred dialog from 700px.
 * Portaled to the body (so no ancestor's `overflow` or stacking context can clip it),
 * which means it must carry its own theme — hence `ThemedLayer`.
 */
export function Modal({
  onClose,
  label,
  className,
  children,
}: {
  onClose: () => void
  label: string
  className?: string
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (typeof document === "undefined") return null

  return createPortal(
    <ThemedLayer>
      <div
        className={cn(
          "fixed inset-0 z-[60] flex items-end justify-center animate-tx-fade motion-reduce:animate-none",
          "bg-tx-scrim backdrop-blur-[7px] min-[700px]:items-center min-[700px]:p-6",
        )}
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-[460px] max-h-[92vh] overflow-y-auto tx-scroll",
            "rounded-t-[24px] px-5 pb-[22px] pt-3.5",
            "bg-tx-surface-solid border border-solid border-tx-line-2 shadow-tx-2 text-tx-txt",
            "animate-tx-sheet-up motion-reduce:animate-none",
            "min-[700px]:rounded-tx-xl min-[700px]:animate-tx-card-in",
            className,
          )}
        >
          {/* Grab handle — the sheet affordance on a phone, meaningless on desktop. */}
          <div className="mx-auto mb-4 h-[5px] w-[42px] rounded-[3px] bg-tx-line-2 min-[700px]:hidden" />
          {children}
        </div>
      </div>
    </ThemedLayer>,
    document.body,
  )
}

export function ModalTitle({ icon, title, onClose }: { icon: IconName; title: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-tx-surface-2 text-tx-accent">
        <Icon name={icon} size={20} stroke={2.2} />
      </span>
      <h3 className="m-0 flex-1 text-lg font-extrabold text-tx-txt">{title}</h3>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-tx-surface text-tx-txt-2 transition-all duration-150 hover:bg-tx-surface-2 hover:text-tx-txt"
      >
        <Icon name="x" size={18} />
      </button>
    </div>
  )
}

/** A full-screen blocking overlay — the teleport. No dismiss: the trip is already paid. */
export function Overlay({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null
  return createPortal(
    <ThemedLayer>
      <div className="fixed inset-0 z-[70] grid place-items-center bg-tx-bg/80 backdrop-blur-[10px] animate-tx-fade motion-reduce:animate-none">
        {children}
      </div>
    </ThemedLayer>,
    document.body,
  )
}
