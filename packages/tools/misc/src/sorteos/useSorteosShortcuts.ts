"use client"

import { useEffect } from "react"

export interface UseSorteosShortcutsProps {
  enabled: boolean
  phase: "setup" | "spin" | "reveal"
  canDraw: boolean
  onDraw: () => void
  onSkip: () => void
  onAgain: () => void
  isFullscreen: boolean
  onExitFullscreen: () => void
}

/**
 * Keyboard shortcuts for sorteos tool:
 * - Space: setup+canDraw → draw; spin → skip; reveal → again
 * - Escape: exit fullscreen
 *
 * Ignores input when:
 * - target is input|textarea|select|button|[role="button"]|[contenteditable]
 * - any [role="dialog"] is open
 * - modifier keys are held
 */
export function useSorteosShortcuts({
  enabled,
  phase,
  canDraw,
  onDraw,
  onSkip,
  onAgain,
  isFullscreen,
  onExitFullscreen,
}: UseSorteosShortcutsProps) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if target is a form control or button
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON" ||
        target.getAttribute("role") === "button" ||
        target.contentEditable === "true"
      ) {
        return
      }

      // Ignore if any dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return
      }

      // Ignore if modifier keys are held
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      // Space: draw / skip / again
      if (e.code === "Space") {
        if (phase === "setup" && canDraw) {
          e.preventDefault()
          onDraw()
        } else if (phase === "spin") {
          e.preventDefault()
          onSkip()
        } else if (phase === "reveal") {
          e.preventDefault()
          onAgain()
        }
      }

      // Escape: exit fullscreen
      if (e.code === "Escape") {
        if (isFullscreen) {
          e.preventDefault()
          onExitFullscreen()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [enabled, phase, canDraw, onDraw, onSkip, onAgain, isFullscreen, onExitFullscreen])
}
