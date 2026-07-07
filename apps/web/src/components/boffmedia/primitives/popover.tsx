"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PopoverProps {
  trigger: React.ReactNode
  align?: "start" | "end"
  side?: "bottom" | "top"
  ariaLabel?: string
  className?: string
  children?: React.ReactNode | ((ctx: { close: () => void }) => React.ReactNode)
}

export function Popover({ trigger, align = "start", side = "bottom", ariaLabel, className, children }: PopoverProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLSpanElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        rootRef.current?.querySelector<HTMLElement>("[data-pop-trigger]")?.focus()
      }
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <span ref={rootRef} className="relative inline-flex">
      <span
        data-pop-trigger
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        {trigger}
      </span>
      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel}
          style={{ boxShadow: "0 1px 0 var(--accent-line), 0 18px 40px -18px rgba(0,0,0,0.7)" }}
          className={cn(
            "absolute z-[60] min-w-[240px] p-[14px] bg-panel border border-solid border-line-2",
            "cut-tag [--cut-tag:9px] animate-[bm-menu-in_0.12s_ease-out] motion-reduce:animate-none",
            side === "top" ? "bottom-[calc(100%_+_6px)]" : "top-[calc(100%_+_6px)]",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
        </div>
      )}
    </span>
  )
}
