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
    <div
      className={cn(
        "relative grid place-items-center rounded-full bg-layer-3",
        "transition-all duration-[var(--dur)] ease-[var(--ease)] border border-solid border-edge",
        sm ? "w-[34px] h-[34px]" : "w-[46px] h-[46px]",
        active && "border-[var(--secondary-hover)] shadow-[0_0_0_3px_var(--secondary-soft),0_0_18px_-4px_var(--secondary-hover)]",
        mon.fnt && "grayscale opacity-40",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
      title={mon.name}
      aria-label={mon.name}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
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
        <span className="absolute left-[4px] right-[4px] bottom-[3px] h-[3px] rounded-[2px] bg-[color-mix(in_srgb,#000_50%,var(--layer-1))] overflow-hidden">
          <span className="block h-full rounded-[2px]" style={{ width: `${pct}%`, background: hpColor(pct) }} />
        </span>
      )}
    </div>
  )
}
