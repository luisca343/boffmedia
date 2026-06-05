"use client"

import { cn } from "@/lib/utils"
import { aniF, hpColor } from "./bs-data"

export interface BSPokeChipMon {
  id: string
  name: string
  hp: number
  fnt?: boolean
}

interface BSPokeChipProps {
  mon: BSPokeChipMon
  active?: boolean
  sm?: boolean
  onClick?: () => void
}

export function BSPokeChip({ mon, active, sm, onClick }: BSPokeChipProps) {
  const pct = mon.fnt ? 0 : mon.hp
  return (
    <button
      className={cn(
        "relative grid place-items-center rounded-full bg-[var(--surface-3)] cursor-pointer",
        "transition-all duration-[var(--dur)] ease-[var(--ease)] border border-solid border-[var(--border)]",
        sm ? "w-[34px] h-[34px]" : "w-[46px] h-[46px]",
        active && "border-[var(--accent-bright)] shadow-[0_0_0_3px_var(--accent-soft),0_0_18px_-4px_var(--accent-bright)]",
        mon.fnt && "grayscale opacity-40",
      )}
      onClick={onClick}
      title={mon.name}
      aria-label={mon.name}
    >
      <img
        src={aniF(mon.id)}
        alt={mon.name}
        loading="lazy"
        className={cn("object-contain", sm ? "w-[30px] h-[30px]" : "w-[40px] h-[40px]")}
        style={{ imageRendering: "auto", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.5))" }}
      />
      {mon.fnt && (
        <span className="absolute inset-0 rounded-full" style={{ background: "repeating-linear-gradient(45deg,transparent 0 5px,color-mix(in srgb,#000 40%,transparent) 5px 7px)" }} />
      )}
      {!mon.fnt && (
        <span className="absolute left-[4px] right-[4px] bottom-[3px] h-[3px] rounded-[2px] bg-[color-mix(in_srgb,#000_50%,var(--surface))] overflow-hidden">
          <span className="block h-full rounded-[2px]" style={{ width: `${pct}%`, background: hpColor(pct) }} />
        </span>
      )}
    </button>
  )
}
