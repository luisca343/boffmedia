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
 * pane and the dock.
 *
 * THE STAGE'S SIZE IS A FUNCTION OF THE SHELL ALONE — never of what the dock
 * happens to be showing. That is the whole rule, and both halves of it matter:
 *
 *  - `flex-none` + `aspect-[16/9]`: the height follows the WIDTH, so opening
 *    the move picker, arming tera or switching to the bench cannot move it.
 *    The stage used to be `shrink-[999]` so the dock could always win the
 *    space it needed — controls were never below the fold, but the field
 *    jumped every time the dock changed rows, which is the thing that made it
 *    uncomfortable to play. The trade is deliberate and this way round now.
 *  - `max-height`: a percentage of this column, which is the shell minus the
 *    header. Without it a short, wide window gives 16:9 a height taller than
 *    the shell, and since the frame hides its overflow the dock would be
 *    pushed out of the box entirely — unreachable controls, which is strictly
 *    worse than the resizing it replaced. The cap letterboxes instead, and
 *    `BattleCanvas` is asked to `fit="contain"`, so it centres in whatever box
 *    it is given. A percentage rather than `--tool-vh` because the shell is
 *    `100dvh` in fullscreen and the two must not disagree there.
 *
 * The dock then takes the REMAINDER (`flex-1`) and scrolls inside itself. Not
 * a fixed pixel height: the split is proportional, so the dock cannot be
 * squeezed to nothing on a short window, and a tall desktop spends the space
 * on visible move keys instead of leaving it blank under a 120px band.
 *
 * Mobile keeps its own bargain — the stage caps at roughly a third so the dock
 * is the primary surface — but it is stable for the same reason as the others.
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
            {/* Stage box: measured by the canvas. 16:9 off the width, capped
                off this column's height — both inputs the dock cannot touch,
                which is what keeps it still. See the rule above the component. */}
            <div
              className={cn(
                "relative isolate flex aspect-[16/9] w-full flex-none min-w-0 items-center justify-center overflow-hidden bg-base-deep",
                mobile ? "max-h-[34%]" : "max-h-[62%]",
              )}
            >
              {canvas}
            </div>

            {/* Dock: whatever the stage left, scrolling inside itself. */}
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
              {dock && (
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-t border-solid border-line bg-panel">
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
