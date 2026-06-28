"use client"

import { cn } from "@/lib/utils"
import { aniF, tyVar } from "./bs-data"
import { BSTypeRow } from "./bs-type"

interface MonCardStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

interface MonCardMon {
  id: string
  name: string
  types: string[]
  stats: MonCardStats
}

interface BSMonCardProps {
  mon: MonCardMon
  order?: number
  lead?: boolean
  onClick?: () => void
  showStats?: boolean
}

export function BSMonCard({ mon, order, lead, onClick, showStats }: BSMonCardProps) {
  const c = tyVar(mon.types[0])
  return (
    <button
      className={cn(
        "flex flex-col gap-[.55rem] rounded-[var(--radius-lg)] relative overflow-hidden text-left font-inherit",
        "bg-[var(--card-bg)] border-edge transition-all duration-[var(--dur)] ease-[var(--ease)]",
        "px-[.85rem] py-[.85rem] text-ink cursor-pointer",
        '[data-direction="neon"]:backdrop-blur-[12px]',
        lead && "border-[var(--secondary-hover)] shadow-[inset_0_0_0_1px_var(--secondary-hover),0_16px_40px_-22px_var(--secondary)]",
      )}
      style={{ "--_c": c } as React.CSSProperties}
      onClick={onClick}
    >
      <span
        className="absolute inset-x-0 top-0 h-[60%] z-0 opacity-50 pointer-events-none"
        style={{ background: `radial-gradient(80% 100% at 50% 0, color-mix(in srgb, ${c} 40%, transparent), transparent 72%)` }}
      />
      <div className="relative z-[1] flex flex-col gap-[.55rem] items-center">
        {order != null && (
          <span className="absolute top-0 left-0 z-[2] w-[24px] h-[24px] rounded-[7px] grid place-items-center font-display font-extrabold text-[.8rem] bg-secondary text-[var(--on-secondary)]">
            {order}
          </span>
        )}
        <img
          src={aniF(mon.id)}
          alt={mon.name}
          loading="lazy"
          className="w-[84px] h-[84px] object-contain mx-auto"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.5))" }}
        />
        <div className="font-display font-extrabold text-t-base text-center">{mon.name}</div>
        <div className="flex gap-[.3rem] justify-center"><BSTypeRow types={mon.types} ghost /></div>
        {showStats && (
          <div className="grid grid-cols-3 gap-[.3rem_.6rem] font-mono text-[.6rem] text-ink-muted">
            {Object.entries({ PS: mon.stats.hp, Atq: mon.stats.atk, Def: mon.stats.def, AtE: mon.stats.spa, DeE: mon.stats.spd, Vel: mon.stats.spe }).map(([k, v]) => (
              <div key={k}>{k} <b className="text-ink font-bold">{v}</b></div>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
