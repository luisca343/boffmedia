"use client"

import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface BattleShellProps {
  /** The stage — primary visual focus (the battle field). */
  children: ReactNode
  header?: ReactNode
  /** Side rail next to the stage (log, chat). */
  rail?: ReactNode
  /** Action dock below the stage (moves, switches, choices). */
  dock?: ReactNode
  /** Post-game / auxiliary content. */
  footer?: ReactNode
  className?: string
  /** When true, the shell covers the full viewport (native fullscreen or CSS fallback). */
  fullscreen?: boolean
}

/**
 * v3 stage-first battle layout: header · field + side rail · action dock · footer.
 * The bx-shell replacement for the v2 GameStageLayout — lives inside the tool chassis.
 */
export const BattleShell = forwardRef<HTMLDivElement, BattleShellProps>(
  function BattleShell({ children, header, rail, dock, footer, className, fullscreen }, ref) {
    return (
      <div
        ref={ref}
        data-ds="boffmedia"
        className={cn(
          "flex flex-col gap-3 bg-base p-3 text-txt",
          fullscreen && "fixed inset-0 z-50 gap-0 overflow-hidden p-0",
          className,
        )}
      >
        {!fullscreen && header}

        <div className={cn("flex min-w-0 flex-col gap-3 lg:flex-row", fullscreen && "min-h-0 flex-1")}>
          <div className={cn("relative flex min-w-0 shrink-0 flex-col", fullscreen && "min-h-0 flex-1")}>{children}</div>
          {rail && (
            <aside
              className={cn(
                "min-w-0 flex-1",
                fullscreen && "mt-8 max-h-[calc(100vh-500px)] shrink-0 overflow-hidden border border-solid border-line bg-panel lg:max-w-[340px]",
              )}
            >
              {rail}
            </aside>
          )}
        </div>

        {dock && (
          <div className={cn(fullscreen && "absolute bottom-4 left-4 right-4 z-10 lg:left-auto lg:w-[580px]")}>{dock}</div>
        )}
        {footer}
      </div>
    )
  },
)
