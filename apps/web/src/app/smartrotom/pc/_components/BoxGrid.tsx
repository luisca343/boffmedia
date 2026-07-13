"use client"

import { locId } from "../_stores/pcUiStore"
import type { Mon, SlotLoc } from "../_types/pc.types"
import { PokemonSlot } from "./PokemonSlot"

export interface GridCell {
  mon: Mon | null
  /** `null` on a padded cell — see `PokemonSlot`. */
  loc: SlotLoc | null
}

export interface BoxGridProps {
  cells: GridCell[]
  droppable?: boolean
  onHover?: (mon: Mon | null, el: HTMLElement | null) => void
}

/** 6 × 5. The one grid every stage renders through — a box, and the results view. */
export function BoxGrid({ cells, droppable = true, onHover }: BoxGridProps) {
  return (
    <div className="grid w-full grid-cols-6 gap-[clamp(6px,0.7vw,11px)]">
      {cells.map((c, i) => (
        <PokemonSlot
          key={c.loc ? locId(c.loc) : `pad-${i}`}
          mon={c.mon}
          loc={c.loc}
          droppable={droppable && !!c.loc}
          onHover={onHover}
        />
      ))}
    </div>
  )
}
