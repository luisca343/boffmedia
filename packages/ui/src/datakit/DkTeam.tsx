import * as React from "react"
import { cn } from "../cn"
import { DkSprite } from "./DkSprite"

export interface DkTeamSlot {
  name: string
  src?: string
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

/** Compact row of team sprites (caller resolves each sprite URL). */
export function DkTeam({ slots, size = 28, className }: { slots: DkTeamSlot[]; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[2px]", className)}>
      {slots.map((s, i) => (
        <DkSprite key={i} src={s.src} alt={s.name} title={s.name} size={size} onError={s.onError} />
      ))}
    </span>
  )
}
