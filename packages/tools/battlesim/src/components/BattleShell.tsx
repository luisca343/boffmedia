"use client"

import { forwardRef, useState, type CSSProperties, type ReactNode } from "react"
import { cn } from "@boffmedia/ui"
import { BattleLayoutProvider, useNodeSize, type BattleLayoutKind } from "../lib/battle-layout"

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
 * happens to be showing. That is the one rule both stances below obey, and it
 * is what stopped the board jumping every time the dock changed rows.
 *
 * ── Pointer / desktop & tablet: OVERLAY ──────────────────────────────────
 * The stage IS the body, and the dock floats over its lower edge in a
 * translucent band.
 *
 * The stack this replaced gave the stage the full column WIDTH but capped its
 * HEIGHT at 62% of the column, and the canvas fits `contain` — so height won,
 * and the field shrank to 16:9 of that height. On a 1834x843 window the field
 * came out 825x464 inside a 1494px column: 334px of dead black down each side,
 * over half the column's width spent on nothing. The field cannot be widened
 * to fill it — the background art is stretched `100% 100%` and every sprite is
 * placed in 960-unit space, so the field is 16:9 or it is distorted. The only
 * way to spend that width is to stop capping the height, which means the dock
 * can no longer sit under the field. It sits ON it. Same window, overlay:
 * 1330x748, +160% field area.
 *
 * Two rules keep the band from swallowing what it covers — the failure that
 * sank the first attempt at this:
 *
 *  - `max-h-[max(25%,9.5rem)]`: a QUARTER of the body, so the band covers the
 *    field's floor and not its inhabitants, with a 152px floor under the
 *    percentage so a short window gets a usable band rather than a scrolling
 *    slit. `max()` rather than a JS stance switch: there is no first frame to
 *    guess wrong, and no second measurement to disagree with the first.
 *    The bench and team list get 48% instead (`data-bx-tall`, set by the dock)
 *    — two rows of six cards do not fit a quarter, and unlike the move row
 *    they are a place you opened on purpose and close again.
 *  - The band is only as tall as its CONTENT, and `BxDock` renders a one-line
 *    strip whenever you have no choice to make. So the quarter is spent only
 *    while you are actually choosing; between turns the field is whole.
 *
 * `--bx-dock-h` publishes the band's measured height to the stage, and
 * `BattleCanvas` lifts the ally HP plates by it — they sit at the field's
 * bottom edge, which is precisely where the band is. Absolutely positioned, so
 * the band's height never feeds back into the stage box that sizes the field.
 *
 * ── Mobile: STACK ────────────────────────────────────────────────────────
 * Unchanged, and deliberately not overlaid. The dock is the primary surface
 * there — a quarter of a phone's height cannot hold it, and a band covering
 * the rest would leave neither readable. The stage keeps its `aspect-[16/9]`
 * off the WIDTH (stable for the same reason: the dock cannot touch it) capped
 * at roughly a third, and the dock takes the remainder and scrolls.
 */
export const BattleShell = forwardRef<HTMLDivElement, BattleShellProps>(function BattleShell(
  { header, canvas, dock, rail, railOpen = false, mobileTabs, overlay, children, layout, fullscreen, className },
  ref,
) {
  const mobile = layout === "mobile"
  const tablet = layout === "tablet"
  const desktop = layout === "desktop"
  // The band floats over the field everywhere except mobile (see the rule above).
  const overlayDock = !mobile
  const [bandNode, setBandNode] = useState<HTMLDivElement | null>(null)
  const band = useNodeSize(bandNode)
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
          {/* THE RAIL ABSORBS THE SLACK — the field never leaves any.
              A 16:9 field in a body that is not 16:9 leaves a sliver over on
              one axis, and on a wide desktop window that sliver was ~100px of
              blurred dressing down each side of the board. So the column is
              sized as the FIELD's box (`aspect-[16/9]` off the full body
              height, which is what `contain` was going to pick anyway) and the
              rail is `flex-1` with a floor rather than a fixed width: it takes
              exactly what is left, whatever that is, and the log — cramped at
              21.25rem — gets the room instead of the gutters.
              `max-w` is the narrow case: when the rail would drop below its
              floor the column clamps, the field goes back to letterboxing
              inside it, and the dressing covers that. Only when there IS a
              persistent rail to absorb it — tablet's is a drawer over the
              field, so there the column stays full-width. */}
          <div
            className={cn(
              "relative flex min-h-0 min-w-0 flex-col",
              desktop && rail
                ? "aspect-[16/9] h-full w-auto flex-none max-w-[calc(100%-21.25rem)]"
                : "flex-1",
            )}
          >
            {overlayDock ? (
              /* Stage box: the whole column, measured by the canvas. The band
                 below is absolutely positioned, so nothing the dock shows can
                 change this box — see the rule above the component. */
              <div
                className="relative isolate flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-base-deep"
                style={{ ["--bx-dock-h" as string]: `${band.height}px` } as CSSProperties}
              >
                {canvas}

                {/* Action band, floating over the field's lower edge. Capped at
                    a quarter of the stage (152px floor) and only as tall as the
                    dock's own content, which collapses to a strip off-turn.
                    `empty:hidden` keeps the chrome off screen between battles,
                    when `BxDock` renders nothing at all. */}
                {dock && (
                  <div
                    ref={setBandNode}
                    className="absolute inset-x-0 bottom-0 z-20 max-h-[max(25%,9.5rem)] min-w-0 overflow-y-auto overscroll-contain border-t border-solid border-line-2 bg-panel/85 backdrop-blur-[8px] empty:hidden has-[[data-bx-tall]]:max-h-[max(48%,16rem)]"
                  >
                    {dock}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Stage box: measured by the canvas. 16:9 off the width, capped
                    off this column's height — both inputs the dock cannot touch,
                    which is what keeps it still. */}
                <div className="relative isolate flex aspect-[16/9] w-full flex-none min-w-0 items-center justify-center overflow-hidden bg-base-deep max-h-[34%]">
                  {canvas}
                </div>

                {/* Dock: whatever the stage left, scrolling inside itself. */}
                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
                  {dock && (
                    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto border-t border-solid border-line bg-panel">
                      {dock}
                    </div>
                  )}
                  {rail && railOpen && (
                    <div className="absolute inset-0 z-20 flex min-h-0 flex-col border-t border-solid border-line bg-panel animate-[bm-drawer-in_200ms_ease_both] motion-reduce:animate-none">
                      {rail}
                    </div>
                  )}
                </div>
              </>
            )}

            {mobile && mobileTabs}
          </div>

          {desktop && rail && (
            <aside className="flex min-h-0 min-w-[21.25rem] flex-1 flex-col border-l border-solid border-line bg-panel">
              {rail}
            </aside>
          )}
          {tablet && rail && railOpen && (
            <aside className="absolute inset-y-0 right-0 z-20 flex w-[min(23.75rem,100%)] flex-col border-l border-solid border-line bg-panel animate-[bm-drawer-in_200ms_ease_both] motion-reduce:animate-none">
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
