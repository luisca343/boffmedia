"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { ModalShell } from "@/components/smartrotom/behavior/ModalShell"

interface SrSheetCtx {
  open: boolean
  setOpen: (open: boolean) => void
}

const Ctx = createContext<SrSheetCtx | null>(null)

function useSheetCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("SrSheet.* must be used within <SrSheet>")
  return ctx
}

/**
 * The sr-* chrome's own side/top drawer, skinned over the shared `ModalShell`
 * (portal, Escape, scrim dismiss, scroll lock, focus trap/restore, dialog semantics
 * all come free from there). Same open/close contract as the Radix `Sheet`
 * family it stands in for.
 */
export function SrSheet({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>
}

export function SrSheetTrigger({ children, className }: { children: ReactNode; className?: string }) {
  const { open, setOpen } = useSheetCtx()
  return (
    <button type="button" aria-expanded={open} aria-haspopup="dialog" className={className} onClick={() => setOpen(true)}>
      {children}
    </button>
  )
}

export function SrSheetClose({ children, className }: { children: ReactNode; className?: string }) {
  const { setOpen } = useSheetCtx()
  return (
    <button type="button" className={className} onClick={() => setOpen(false)}>
      {children}
    </button>
  )
}

type SrSheetSide = "top" | "right"

const SCRIM_FADE =
  "animate-in fade-in-0 animate-duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:animate-duration-300"

const SIDE_SCRIM: Record<SrSheetSide, string> = {
  top: `z-50 flex items-start justify-center bg-black/80 ${SCRIM_FADE}`,
  right: `z-50 flex items-stretch justify-end bg-black/80 ${SCRIM_FADE}`,
}

const SIDE_PANEL: Record<SrSheetSide, string> = {
  top: "w-full border-b gap-4 p-6 animate-in slide-in-from-top animate-duration-500 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=closed]:animate-duration-300",
  right: "h-full w-3/4 border-l gap-4 p-6 animate-in slide-in-from-right animate-duration-500 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:animate-duration-300",
}

// Must match the data-[state=closed] duration above.
const EXIT_MS = 300

export function SrSheetContent({
  side = "right",
  label,
  scope = "",
  className,
  children,
}: {
  side?: SrSheetSide
  label: string
  /** The app's scope-root classes, so the portaled panel keeps its tokens. Chrome vars are global, so "" is fine here. */
  scope?: string
  className?: string
  children: ReactNode
}) {
  const { open, setOpen } = useSheetCtx()
  return (
    <ModalShell
      onClose={() => setOpen(false)}
      label={label}
      scope={scope}
      open={open}
      exitDurationMs={EXIT_MS}
      scrimClassName={SIDE_SCRIM[side]}
      className={cn("relative shadow-lg", SIDE_PANEL[side], className)}
    >
      {children}
    </ModalShell>
  )
}

export function SrSheetHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-col space-y-2", className)}>{children}</div>
}

export function SrSheetTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}
