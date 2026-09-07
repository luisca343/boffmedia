import { createPortal } from "react-dom"
import * as React from "react"
import { cn } from "../cn"

export type HoverCardSide = "top" | "bottom"
export type HoverCardAlign = "start" | "center" | "end"

export interface HoverCardProps {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: HoverCardSide
  align?: HoverCardAlign
  ariaLabel?: string
  className?: string
}

/** A hover/focus panel rendered in a body portal so clipped parents cannot swallow it. */
export function HoverCard({ trigger, children, side = "top", align = "center", ariaLabel, className }: HoverCardProps) {
  const rootRef = React.useRef<HTMLSpanElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ left: 0, top: 0, ready: false })

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  const show = React.useCallback(() => {
    cancelClose()
    setOpen(true)
  }, [cancelClose])

  const hide = React.useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }, [cancelClose])

  const place = React.useCallback(() => {
    const anchor = rootRef.current?.getBoundingClientRect()
    const panel = panelRef.current
    if (!anchor || !panel) return

    const width = panel.offsetWidth
    const height = panel.offsetHeight
    const gap = 8
    const rawLeft = align === "start" ? anchor.left : align === "end" ? anchor.right - width : anchor.left + (anchor.width - width) / 2
    const left = Math.max(8, Math.min(window.innerWidth - width - 8, rawLeft))
    const rawTop = side === "top" ? anchor.top - height - gap : anchor.bottom + gap
    const top = Math.max(8, Math.min(window.innerHeight - height - 8, rawTop))
    setPosition({ left, top, ready: true })
  }, [align, side])

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition((current) => (current.ready ? { ...current, ready: false } : current))
      return undefined
    }
    place()
    const onViewportChange = () => place()
    window.addEventListener("resize", onViewportChange)
    window.addEventListener("scroll", onViewportChange, true)
    return () => {
      window.removeEventListener("resize", onViewportChange)
      window.removeEventListener("scroll", onViewportChange, true)
    }
  }, [open, place])

  React.useEffect(() => () => cancelClose(), [cancelClose])

  const panel = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={panelRef}
          role="tooltip"
          aria-label={ariaLabel}
          onMouseEnter={cancelClose}
          onMouseLeave={hide}
          className={cn(
            "fixed z-[500] max-w-[calc(100vw-1rem)] border border-solid border-line-2 bg-base-deep p-3 text-txt",
            "cut-tag cut-tag-edge [--cut-tag:8px] [--cut-line:var(--line-2)]",
            "shadow-[0_18px_45px_-18px_rgba(0,0,0,0.8)] animate-[bm-menu-in_0.14s_ease-out] motion-reduce:animate-none",
            !position.ready && "invisible",
            className,
          )}
          style={{ left: position.left, top: position.top }}
        >
          {children}
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <span
        ref={rootRef}
        tabIndex={0}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex focus-visible:outline-2 focus-visible:outline-accent-line focus-visible:outline-offset-2"
      >
        {trigger}
      </span>
      {panel}
    </>
  )
}
