"use client"

import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface GameStageLayoutProps {
  /** The stage — primary visual focus (e.g. battle canvas). */
  children: ReactNode
  header?: ReactNode
  /** Side rail next to the stage (log, chat, info). */
  rail?: ReactNode
  /** Action dock below the stage (controls, choices). */
  dock?: ReactNode
  /** Contextual status line between dock and footer. */
  statusBar?: ReactNode
  /** Post-game / auxiliary content. */
  footer?: ReactNode
  className?: string
  /** When true, the layout covers the full viewport (native fullscreen or CSS fallback). */
  fullscreen?: boolean
}

/**
 * Stage-first game layout: header / stage + side rail / dock / footer.
 * Promoted from battlesim's BattleLayout — domain-agnostic.
 */
export const GameStageLayout = forwardRef<HTMLDivElement, GameStageLayoutProps>(
  function GameStageLayout({ children, header, rail, dock, statusBar, footer, className, fullscreen }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-4 p-4",
          fullscreen && "fixed inset-0 z-50 overflow-hidden p-0 gap-0",
          className,
        )}
        style={{ color: "var(--text)", background: "var(--bg)" }}
      >
        {!fullscreen && header}

        {/* Stage + rail: side-by-side on desktop, stacked on small screens */}
        <div className={cn("flex flex-col lg:flex-row gap-4", fullscreen ? "flex-1 min-h-0" : "")}>
          <div className={cn("flex flex-col relative shrink-0 min-w-0", fullscreen ? "flex-1 min-h-0" : "")}>{children}</div>
          {rail && (
            <aside
              className={cn("flex-1 min-w-0", fullscreen ? "shrink-0 overflow-hidden lg:max-w-[340px] rounded-[var(--radius)]" : "")}
              style={fullscreen ? { background: 'var(--layer-1)', border: '1px solid var(--border)', maxHeight: 'calc(100vh - 500px)', marginTop: '2rem' } : undefined}
            >
              {rail}
            </aside>
          )}
        </div>

        {dock && (
          <div className={cn(fullscreen && "absolute bottom-4 right-4 left-4 lg:left-auto lg:w-[580px] z-10")}>
            {dock}
          </div>
        )}
        {statusBar}
        {footer}
      </div>
    )
  },
)
