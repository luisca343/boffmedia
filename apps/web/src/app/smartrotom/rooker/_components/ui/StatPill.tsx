import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/**
 * One tile in the trainer-stat row on a profile: CAPTURAS, COMBATES, SHINIES, POKÉDEX.
 *
 * Every figure here is derived from real data — the Pokédex registry and the replay
 * log — so they are tabular-nums: four tiles side by side must align on their digits
 * or the row reads as ragged.
 *
 * `tone` is a literal class, never interpolated.
 */
export type StatTone = "accent" | "fuego" | "shiny" | "choque"

const TONE: Record<StatTone, string> = {
  accent: "text-rk-accent",
  fuego: "text-rk-fuego",
  shiny: "text-rk-shiny",
  choque: "text-rk-choque",
}

export interface StatPillProps {
  value: string | number
  label: string
  icon: IconName
  tone?: StatTone
  filled?: boolean
}

export function StatPill({ value, label, icon, tone = "accent", filled = false }: StatPillProps) {
  return (
    <div className="min-w-0 flex-1 rounded-rk-md border border-rk-line bg-rk-card px-1.5 py-2.5 text-center">
      <div className="flex items-center justify-center gap-1.5">
        <Icon name={icon} size={14} fill={filled} className={cn("flex-none", TONE[tone])} />
        <span className="text-[1.125rem] font-bold tabular-nums text-rk-fg">{value}</span>
      </div>
      <div className="mt-0.5 text-[0.6875rem] font-semibold tracking-[.02em] text-rk-fg-subtle">{label}</div>
    </div>
  )
}
