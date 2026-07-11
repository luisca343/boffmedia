"use client"

import { Icon } from "@/components/boffmedia/primitives"
import { PokemonSprite } from "./ui/PokemonSprite"
import { cssVars } from "./ui/theme"
import type { CalcPokemon } from "../_types/calculator"

interface Props {
  label: string
  color: string
  pokes: CalcPokemon[]
  max: number
  addLabel: string
  onEdit: (idx: number) => void
  onRemove: (idx: number) => void
  onAdd: () => void
}

// team / threats slot column for the matrix.
export function TeamSlots({ label, color, pokes, max, addLabel, onEdit, onRemove, onAdd }: Props) {
  return (
    <div className="grid content-start gap-2" style={cssVars({ "--cxc": color })}>
      <div className="flex items-center gap-2 font-mono text-[11px]/none font-bold uppercase tracking-[0.12em]" style={{ color: "var(--cxc)" }}>
        {label}
        <span className="ml-auto font-semibold text-txt-dim">
          {pokes.length}/{max}
        </span>
      </div>
      {pokes.map((p, i) => (
        <div key={i} className="flex items-stretch gap-1">
          <button
            type="button"
            onClick={() => onEdit(i)}
            title={p.name}
            className="flex min-w-0 flex-1 items-center gap-2 border border-l-[3px] border-solid border-line bg-panel px-[9px] py-[7px] text-left transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2"
            style={{ borderLeftColor: "var(--cxc)" }}
          >
            <PokemonSprite name={p.name} size={30} />
            <span className="min-w-0">
              <span className="block truncate font-display text-[12px]/[1.1] font-bold uppercase tracking-[0.03em]">{p.name}</span>
              <span className="block truncate font-mono text-[10px]/[1.3] text-txt-dim">{p.item !== "None" ? p.item : p.nature}</span>
            </span>
          </button>
          <button
            type="button"
            aria-label={`✕ ${p.name}`}
            onClick={() => onRemove(i)}
            className="grid w-[26px] place-items-center border border-solid border-transparent text-txt-dim hover:border-[color-mix(in_srgb,var(--bad)_40%,transparent)] hover:text-bad"
          >
            <Icon name="x" size={13} />
          </button>
        </div>
      ))}
      {pokes.length < max && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-[7px] border border-dashed border-line-2 bg-transparent p-[9px] font-mono text-[11px]/none font-semibold uppercase tracking-[0.08em] text-txt-dim transition-[color,border-color] duration-[140ms] hover:border-accent-line hover:text-accent-bright"
        >
          <Icon name="plus" size={13} />
          {addLabel}
        </button>
      )}
    </div>
  )
}
