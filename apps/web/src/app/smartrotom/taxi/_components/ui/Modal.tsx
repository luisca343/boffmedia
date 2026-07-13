"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"
import { Icon, type IconName } from "./Icon"
import { TX_SCOPE } from "./ThemedLayer"

/**
 * The taxi's one overlay shape: a bottom sheet on a phone, a centred dialog from 700px.
 * A skin over the shared `ModalShell` — portal, Escape, scrim dismiss, scroll lock,
 * focus trap/restore and dialog semantics all come from there (SMARTROTOM_V3 §2).
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
  return (
    <ModalShell
      onClose={onClose}
      label={label}
      scope={TX_SCOPE}
      scrimClassName="z-[60] flex items-end justify-center animate-tx-fade motion-reduce:animate-none bg-tx-scrim backdrop-blur-[7px] min-[700px]:items-center min-[700px]:p-6"
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
    </ModalShell>
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
  return (
    <ModalShell
      onClose={() => {}}
      label="Cargando"
      scope={TX_SCOPE}
      closeOnEscape={false}
      closeOnScrim={false}
      scrimClassName="z-[70] grid place-items-center bg-tx-bg/80 backdrop-blur-[10px] animate-tx-fade motion-reduce:animate-none"
    >
      {children}
    </ModalShell>
  )
}
