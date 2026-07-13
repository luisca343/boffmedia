import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { GameAccent } from "../_data/games"

export interface GameStageProps {
  accent?: GameAccent
  children: ReactNode
  /**
   * Clip children to the stage. On by default. Turn it OFF when a control inside
   * has to overflow it (Squirdle's autocomplete). Safe to do: `ar-horizon` masks
   * itself and the CRT overlay inherits the radius, so nothing leaks.
   */
  clip?: boolean
  className?: string
}

// The CRT bloom behind the game, tinted by the cabinet's accent.
const BLOOM: Record<GameAccent, string> = {
  cyan: "bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-cyan)/.16),rgb(var(--ar-void))_60%)]",
  magenta:
    "bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-magenta)/.18),rgb(var(--ar-void))_60%)]",
  violet: "bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-violet)/.18),rgb(var(--ar-void))_60%)]",
  amber: "bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-amber)/.16),rgb(var(--ar-void))_60%)]",
  lime: "bg-[radial-gradient(80%_60%_at_50%_0%,rgb(var(--ar-lime)/.16),rgb(var(--ar-void))_60%)]",
}

/**
 * The cabinet body: the lit screen a game is played on. It continues the frame
 * `GameTopBar` opens, so the two always render as one machine. The page
 * background belongs to `ArcadeShell` — a stage never paints one.
 */
export function GameStage({ accent = "cyan", children, clip = true, className }: GameStageProps) {
  return (
    <div
      className={cn(
        "ar-scanlines rounded-b-2xl border border-t-0 border-white/[.06] p-4 md:p-6",
        clip ? "overflow-hidden" : "overflow-visible",
        BLOOM[accent],
        className,
      )}
    >
      <div aria-hidden className="ar-horizon opacity-40" />
      <div className="relative z-[2]">{children}</div>
    </div>
  )
}
