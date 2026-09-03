"use client"

import { forwardRef, type ReactNode } from "react"
import { cn } from "@boffmedia/ui"
import { BattleLayoutProvider, type BattleLayoutKind } from "../lib/battle-layout"

interface BattleShellProps {
  /** The one bar: back, mode, tabs, score plates, timers, fullscreen, forfeit. */
  header: ReactNode
  /** The canvas (rendered inside the stage box, which it measures). */
  canvas: ReactNode
  /** Action dock — a band under the canvas; the primary surface on mobile. */
  dock?: ReactNode
  /** Log/chat. Desktop: fixed right rail. Tablet: drawer. Mobile: sheet over the dock. */
  rail?: ReactNode
  railOpen?: boolean
  /** Mobile bottom tab bar (Acciones · Registro · Chat). */
  mobileTabs?: ReactNode
  /** Preview / end screen — covers the whole body below the bar. */
  overlay?: ReactNode
  /** Portalled dialogs and other zero-size children. */
  children?: ReactNode
  layout: BattleLayoutKind
  fullscreen?: boolean
  className?: string
}

/**
 * The viewport-true battle frame. It fills the host's box (`--tool-vh`)
 * exactly and hides its own overflow: the only scrollers below are the log
 * pane and, on small screens, the dock. The canvas box is `flex-1` and the
 * dock keeps its natural height, so when the two cannot both fit it is the
 * canvas that gives way — the controls are never below the fold.
 */
export const BattleShell = forwardRef<HTMLDivElement, BattleShellProps>(function BattleShell(
  { header, canvas, dock, rail, railOpen = false, mobileTabs, overlay, children, layout, fullscreen, className },
  ref,
) {
  const mobile = layout === "mobile"
  const tablet = layout === "tablet"
  const desktop = layout === "desktop"
  return (
    <BattleLayoutProvider value={layout}>
      <div
        ref={ref}
        data-layout={layout}
        className={cn(
          "relative flex h-[var(--tool-vh,100dvh)] min-h-0 w-full flex-col overflow-hidden bg-base text-txt",
          fullscreen && "fixed inset-0 z-50 h-[100dvh]",
          className,
        )}
      >
        {header}

        <div className="relative flex min-h-0 min-w-0 flex-1">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Stage box: measured by the canvas. Mobile keeps a 16:9 header
                capped at roughly a third of the tool box so the dock stays
                the primary surface. */}
            <div
              className={cn(
                "relative isolate flex min-w-0 items-center justify-center overflow-hidden bg-base-deep",
                // Natural 16:9 height, shrinking only when the dock needs the room
                // — never growing past it, or a portrait tablet letterboxes the
                // field between two black bands.
                mobile ? "aspect-[16/9] w-full flex-none" : "aspect-[16/9] min-h-[160px] w-full shrink-[999]",
              )}
              style={mobile ? { maxHeight: "calc(var(--tool-vh, 100dvh) * 0.34)" } : undefined}
            >
              {canvas}
            </div>

            <div className={cn("relative flex min-h-0 min-w-0 flex-col", mobile ? "flex-1" : "min-h-[120px] shrink")}>
              {dock && (
                <div className={cn("min-h-0 min-w-0 overflow-y-auto border-t border-solid border-line bg-panel", mobile ? "flex-1" : "shrink")}>
                  {dock}
                </div>
              )}
              {mobile && rail && railOpen && (
                <div className="absolute inset-0 z-20 flex min-h-0 flex-col border-t border-solid border-line bg-panel animate-[bm-drawer-in_200ms_ease_both] motion-reduce:animate-none">
                  {rail}
                </div>
              )}
            </div>

            {mobile && mobileTabs}
          </div>

          {desktop && rail && (
            <aside className="flex w-[340px] min-w-0 shrink-0 flex-col border-l border-solid border-line bg-panel">
              {rail}
            </aside>
          )}
          {tablet && rail && railOpen && (
            <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(380px,100%)] flex-col border-l border-solid border-line bg-panel animate-[bm-drawer-in_200ms_ease_both] motion-reduce:animate-none">
              {rail}
            </aside>
          )}

          {overlay && <div className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden">{overlay}</div>}
        </div>

        {children}
      </div>
    </BattleLayoutProvider>
  )
})
