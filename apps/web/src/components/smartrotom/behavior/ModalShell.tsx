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
  children,
}: ModalShellProps) {
  const panel = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!closeOnEscape) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [closeOnEscape, onClose])

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

  if (!mounted) return null

  return createPortal(
    <ThemedLayer scope={scope}>
      <div
        // mousedown, not click: a drag that starts inside the panel and ends
        // on the scrim would otherwise close the modal.
        onMouseDown={(e) => {
          if (closeOnScrim && e.target === e.currentTarget) onClose()
        }}
        className={`fixed inset-0 ${scrimClassName ?? ""}`}
      >
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          className={className}
        >
          {children}
        </div>
      </div>
    </ThemedLayer>,
    document.body,
  )
}
