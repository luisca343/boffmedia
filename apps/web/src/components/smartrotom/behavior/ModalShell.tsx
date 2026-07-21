"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { ThemedLayer } from "./ThemedLayer"

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface ModalShellProps {
  onClose: () => void
  /** Accessible name for the dialog (the skin usually shows it as a title too). */
  label: string
  /** The app's scope-root classes (e.g. "ps-app font-ps") so portaled content keeps its tokens. */
  scope: string
  /** Skin for the scrim. Positioning (fixed inset-0) is baked; pass z-index, color, blur, centering. */
  scrimClassName?: string
  /** Skin for the dialog panel. */
  className?: string
  closeOnScrim?: boolean
  closeOnEscape?: boolean
  /**
   * Exit-animation support: pass `open` (instead of conditionally rendering the
   * shell) together with `exitDurationMs`, and the shell defers unmount that long
   * after `open` flips false. Scrim and panel carry `data-state="open"|"closed"`,
   * so skins declare exits as `data-[state=closed]:animate-out …` classes.
   * Omitted (default), the shell unmounts immediately — the legacy behavior.
   */
  open?: boolean
  exitDurationMs?: number
  children: ReactNode
}

/**
 * The one modal behavior, unstyled: portal + escape + scrim dismissal + body
 * scroll lock + focus trap + focus restore + dialog semantics. Per-app Modal
 * skins wrap this — never re-implement any of it locally.
 */
export function ModalShell({
  onClose,
  label,
  scope,
  scrimClassName,
  className,
  closeOnScrim = true,
  closeOnEscape = true,
  open = true,
  exitDurationMs = 0,
  children,
}: ModalShellProps) {
  const panel = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Create a stable container for the portal
  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = document.createElement("div")
      containerRef.current.setAttribute("data-modal-portal", "")
    }
    const container = containerRef.current
    document.body.appendChild(container)
    setMounted(true)
    
    return () => {
      // Use try-catch to handle cases where the node might already be removed
      try {
        if (container.parentNode === document.body) {
          document.body.removeChild(container)
        }
      } catch (e) {
        // Silently handle if the node was already removed
      }
    }
  }, [])

  // Deferred unmount: stay present for exitDurationMs after `open` flips false
  // so the closed-state animation can play.
  const [present, setPresent] = useState(open)
  useEffect(() => {
    if (open) {
      setPresent(true)
      return
    }
    if (!exitDurationMs) {
      setPresent(false)
      return
    }
    const t = setTimeout(() => setPresent(false), exitDurationMs)
    return () => clearTimeout(t)
  }, [open, exitDurationMs])
  const closing = !open && present

  useEffect(() => {
    if (!closeOnEscape || !open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [closeOnEscape, onClose, open])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // Focus the first focusable element (or the panel itself) on open; restore
  // focus to the opener on close.
  useEffect(() => {
    if (!mounted) return
    const opener = document.activeElement as HTMLElement | null
    const target = panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current
    target?.focus()
    return () => opener?.focus?.()
  }, [mounted])

  const onKeyDown = useCallback((e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panel.current) return
    const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) {
      e.preventDefault()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panel.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  if (!mounted || !present || !containerRef.current) return null

  return createPortal(
    <ThemedLayer scope={scope}>
      <div
        // mousedown, not click: a drag that starts inside the panel and ends
        // on the scrim would otherwise close the modal.
        onMouseDown={(e) => {
          if (closeOnScrim && open && e.target === e.currentTarget) onClose()
        }}
        data-state={closing ? "closed" : "open"}
        className={`fixed inset-0 ${closing ? "pointer-events-none" : ""} ${scrimClassName ?? ""}`}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          data-state={closing ? "closed" : "open"}
          className={className}
        >
          {children}
        </div>
      </div>
    </ThemedLayer>,
    containerRef.current,
  )
}
