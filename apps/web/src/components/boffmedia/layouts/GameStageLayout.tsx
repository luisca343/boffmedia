"use client"

import type { ReactNode } from "react"
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
}

/**
 * Stage-first game layout: header / stage + side rail / dock / footer.
 * Promoted from battlesim's BattleLayout — domain-agnostic.
 */
export function GameStageLayout({ children, header, rail, dock, statusBar, footer, className }: GameStageLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)} style={{ color: "var(--text)", background: "var(--bg)" }}>
      {header}

      {/* Stage + rail: side-by-side on desktop, stacked on small screens */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col relative shrink-0 min-w-0">{children}</div>
        {rail && <aside className="flex-1 min-w-0">{rail}</aside>}
      </div>

      {dock}
      {statusBar}
      {footer}
    </div>
  )
}
