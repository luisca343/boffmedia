"use client"

import { cn } from "@/lib/utils"
import { tyVar, effMult, effLabel } from "./bs-data"
import { BSType } from "./bs-type"
import { BSCat } from "./bs-type"

interface MoveData {
  name: string
  type: string
  cat: string
  power: number
  acc: number | null
  pp: number
  maxpp: number
}

interface MoveTarget {
  types: string[]
}

interface BSMoveProps {
  move: MoveData
  target?: MoveTarget | null
  onClick?: () => void
  disabled?: boolean
}

export function BSMove({ move, target, onClick, disabled }: BSMoveProps) {
  const eff = move.cat === "status" ? null : effLabel(effMult(move.type, target ? target.types : []))
  const off = disabled || move.pp <= 0
  const c = tyVar(move.type)
  return (
    <button
      className={cn(
        "relative flex flex-col gap-[.5rem] text-left rounded-[var(--radius-lg)] cursor-pointer",
        "border text-[var(--text)] font-inherit overflow-hidden",
        "transition-all duration-[var(--dur)] ease-[var(--ease)]",
        off && "opacity-40 cursor-not-allowed saturate-[.4]",
        !off && "hover:translate-y-[-3px] active:translate-y-0",
      )}
      style={{
        padding: ".85rem .95rem",
        background: `linear-gradient(160deg, color-mix(in srgb, ${c} 16%, var(--surface)), var(--surface))`,
        borderColor: off ? undefined : `color-mix(in srgb, ${c} 40%, var(--border))`,
      }}
      onClick={off ? undefined : onClick}
      disabled={off}
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: c }} />
      <div className="flex items-start justify-between gap-[.5rem]">
        <span className="font-display font-bold text-[var(--t-base)] leading-[1.1]">{move.name}</span>
        <BSType type={move.type} />
      </div>
      <div className="flex items-center justify-between gap-[.5rem] font-mono text-[.64rem] text-[var(--text-muted)] tracking-[.04em]">
        <BSCat cat={move.cat as "phys" | "spec" | "status"} />
        {eff && (
          <span
            className={cn(
              "font-mono font-bold text-[.6rem] tracking-[.06em] px-[.45em] py-[.18em] rounded-[4px]",
              eff.cls === "super" && "text-[var(--emerald-400)] bg-[color-mix(in_srgb,var(--emerald-500)_16%,transparent)]",
              eff.cls === "weak" && "text-[var(--rose-400)] bg-[color-mix(in_srgb,var(--rose-500)_16%,transparent)]",
              eff.cls === "immune" && "text-[var(--text-dim)] bg-[var(--surface-3)]",
            )}
          >
            {eff.t}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-[.5rem] font-mono text-[.64rem] text-[var(--text-muted)] tracking-[.04em]">
        <span className="flex items-center gap-[.3rem]">
          PP <b className="text-[var(--text)] tabular-nums">{move.pp}/{move.maxpp}</b>
        </span>
        <span>{move.cat === "status" ? "—" : `Pot ${move.power}`}{move.acc != null ? `  ·  Pre ${move.acc}` : ""}</span>
      </div>
    </button>
  )
}
