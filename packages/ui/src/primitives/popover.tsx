"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "../cn"
import { useDismiss } from "../hooks/use-dismiss"

export interface PopoverProps {
  trigger: React.ReactNode
  align?: "start" | "end"
  side?: "bottom" | "top"
  /** Render the floating layer under body so overflow/clip ancestors cannot cut it. */
  portal?: boolean
  ariaLabel?: string
  className?: string
  children?: React.ReactNode | ((ctx: { close: () => void }) => React.ReactNode)
}

const useIsoLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

export function Popover({ trigger, align = "start", side = "bottom", portal = false, ariaLabel, className, children }: PopoverProps) {
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const popupRef = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState<{ top?: number; bottom?: number; left?: number; right?: number }>({})

  useDismiss(
    rootRef,
    (reason) => {
      setOpen(false)
      if (reason === "escape") rootRef.current?.querySelector<HTMLElement>("[data-pop-trigger]")?.focus()
    },
    open,
    portal ? popupRef : undefined,
  )

  useIsoLayoutEffect(() => {
    if (!open || !portal) return
    const place = () => {
      const triggerElement = rootRef.current?.querySelector<HTMLElement>("[data-pop-trigger]")
      if (!triggerElement) return
      const rect = triggerElement.getBoundingClientRect()
      const estimatedHeight = 380
      const openUp = side === "top" || (rect.bottom + estimatedHeight > window.innerHeight - 8 && rect.top - estimatedHeight > 8)
      setCoords({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        ...(align === "end"
          ? { right: Math.max(8, window.innerWidth - rect.right) }
          : { left: Math.max(8, rect.left) }),
      })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [align, open, portal, side])

  const popup = open ? (
    <div
      ref={popupRef}
      role="dialog"
      aria-label={ariaLabel}
      style={{
        boxShadow: "0 1px 0 var(--accent-line), 0 18px 40px -18px rgba(0,0,0,0.7)",
        ...(portal ? { position: "fixed" as const, top: coords.top, bottom: coords.bottom, left: coords.left, right: coords.right } : {}),
      }}
      className={cn(
        portal ? "fixed z-[950]" : "absolute z-[60]",
        "min-w-[15rem] p-[0.875rem] bg-panel border border-solid border-line-2",
        "cut-tag cut-tag-edge [--cut-tag:9px] [--cut-line:var(--line-2)]",
        "animate-[bm-menu-in_0.12s_ease-out] motion-reduce:animate-none",
        !portal && (side === "top" ? "bottom-[calc(100%_+_6px)]" : "top-[calc(100%_+_6px)]"),
        !portal && (align === "end" ? "right-0" : "left-0"),
        className,
      )}
    >
      {typeof children === "function" ? children({ close: () => setOpen(false) }) : children}
    </div>
  ) : null

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
        className="focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-[3px]"
      >
        {trigger}
      </span>
      {!portal && popup}
      {portal && typeof document !== "undefined" && popup ? createPortal(popup, document.body) : null}
    </span>
  )
}
