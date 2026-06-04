"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BoffPopoverProps {
  trigger: React.ReactElement
  children: React.ReactNode | ((close: () => void) => React.ReactNode)
  align?: "start" | "center" | "end"
  width?: number
}

export function BoffPopover({ trigger, children, align = "start", width = 280 }: BoffPopoverProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey) }
  }, [open])
  const alignStyles = { start: { left: 0 }, center: { left: "50%", transform: "translateX(-50%)" }, end: { right: 0 } }

  return (
    <span className="relative inline-flex" ref={ref}>
      {React.cloneElement(trigger, { onClick: () => setOpen(!open) } as React.HTMLAttributes<HTMLElement>)}
      {open && (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] z-[130] p-4",
            "bg-[var(--surface)]",
            "border border-solid border-[var(--border-strong)]",
            "rounded-[var(--radius-lg,22px)]",
            "shadow-[0_24px_50px_-20px_var(--shadow-color)]",
            "animate-dd-in",
            "data-[direction=neon]:backdrop-blur-[4px] data-[direction=neon]:bg-[color-mix(in_srgb,var(--surface)_90%,transparent)]",
            "data-[direction=hud]:shadow-[5px_5px_0_0_var(--hud-shadow)]",
          )}
          style={{ width, ...alignStyles[align] }}
          role="dialog"
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </span>
  )
}
