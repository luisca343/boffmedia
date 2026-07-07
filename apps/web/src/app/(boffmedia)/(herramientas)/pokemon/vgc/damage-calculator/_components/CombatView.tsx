"use client"

import * as React from "react"
import { useCalculatorStore } from "../_store/calculatorStore"
import { PokemonPanel } from "./PokemonPanel"
import { FieldPanel } from "./FieldPanel"
import { VersusStrip, type Sel } from "./VersusStrip"

// Combate (1v1) — results strip on top, 3-column config below.
export function CombatView() {
  const { poke1, poke2, field, useChampions, setPoke1, setPoke2, setField, setAttackerSide, setDefenderSide } =
    useCalculatorStore()
  const [sel, setSel] = React.useState<Sel>(null)

  return (
    <>
      <VersusStrip poke1={poke1} poke2={poke2} field={field} useChampions={useChampions} sel={sel} setSel={setSel} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(240px,300px)_minmax(0,1fr)] items-start gap-4 max-[1280px]:grid-cols-2 max-[920px]:grid-cols-1">
        <div>
          <PokemonPanel poke={poke1} side="atk" useChampions={useChampions} onChange={setPoke1} />
        </div>
        <div className="max-[1280px]:order-3 max-[1280px]:col-span-full">
          <FieldPanel field={field} setField={setField} setAtkSide={setAttackerSide} setDefSide={setDefenderSide} />
        </div>
        <div>
          <PokemonPanel poke={poke2} side="def" useChampions={useChampions} onChange={setPoke2} />
        </div>
      </div>
    </>
  )
}
