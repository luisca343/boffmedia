"use client"

import * as React from "react"
import { useVgcT } from "../../i18n";
import { Seg } from "@boffmedia/ui"
import { useCalculatorStore, defaultPokemon } from "../_store/calculatorStore"
import type { CalcPokemon } from "../_types/calculator"
import { FieldBar } from "./FieldBar"
import { TeamSlots } from "./TeamSlots"
import { MatrixGrid } from "./MatrixGrid"
import { SideDrawer } from "./ui/SideDrawer"
import { PokemonPanel } from "./PokemonPanel"
import { ATK_COLOR, DEF_COLOR } from "./ui/theme"

type Dir = "tvm" | "mvt"
type ListKey = "team" | "many"
type Slot = { list: ListKey; idx: number } | null

// MatrixView — damage matrix with switchable direction + slot editor drawer.
export function MatrixView() {
  const t = useVgcT("calc")
  const {
    team, many, field, useChampions,
    setField, setAttackerSide, setDefenderSide,
    addToTeam, removeFromTeam, updateTeamPokemon,
    addToMany, removeFromMany, updateManyPokemon,
  } = useCalculatorStore()
  const [dir, setDir] = React.useState<Dir>("tvm")
  const [slot, setSlot] = React.useState<Slot>(null)

  const isTvM = dir === "tvm"
  const attackers = isTvM ? team : many
  const defenders = isTvM ? many : team
  const aList: ListKey = isTvM ? "team" : "many"
  const dList: ListKey = isTvM ? "many" : "team"

  const newPoke = (): CalcPokemon => ({ ...defaultPokemon(), ability: "" })
  const addTo = (list: ListKey) => {
    if (list === "team") {
      if (team.length >= 6) return
      addToTeam(newPoke())
      setSlot({ list, idx: team.length })
    } else {
      if (many.length >= 12) return
      addToMany(newPoke())
      setSlot({ list, idx: many.length })
    }
  }
  const removeFrom = (list: ListKey, idx: number) => {
    ;(list === "team" ? removeFromTeam : removeFromMany)(idx)
    setSlot(null)
  }
  const slotPoke = slot ? (slot.list === "team" ? team : many)[slot.idx] : null
  const updSlot = (patch: Partial<CalcPokemon>) => {
    if (!slot) return
    ;(slot.list === "team" ? updateTeamPokemon : updateManyPokemon)(slot.idx, patch)
  }

  return (
    <div>
      <div className="mb-[0.875rem] flex flex-wrap items-center gap-[0.875rem]">
        <Seg
          value={dir}
          onChange={(v) => setDir(v as Dir)}
          options={[
            { value: "tvm", label: t("tabs.teamThreats") },
            { value: "mvt", label: t("tabs.threatsTeam") },
          ]}
        />
        <span className="font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.12em] text-txt-dim">{t("ui.matrixHint")}</span>
      </div>

      <FieldBar field={field} setField={setField} setAtkSide={setAttackerSide} setDefSide={setDefenderSide} />

      <div className="grid grid-cols-[13.125rem_minmax(0,1fr)_13.125rem] items-start gap-4 max-[1280px]:grid-cols-1">
        <TeamSlots
          label={isTvM ? t("ui.myTeam") : t("ui.threats")}
          color={ATK_COLOR}
          pokes={attackers}
          max={isTvM ? 6 : 12}
          addLabel={t("ui.add")}
          onEdit={(i) => setSlot({ list: aList, idx: i })}
          onRemove={(i) => removeFrom(aList, i)}
          onAdd={() => addTo(aList)}
        />
        <MatrixGrid
          attackers={attackers}
          defenders={defenders}
          field={field}
          useChampions={useChampions}
          cornerLabel={t("ui.matrixCorner")}
          emptyLabel={t("ui.matrixEmpty")}
        />
        <TeamSlots
          label={isTvM ? t("ui.threats") : t("ui.myTeam")}
          color={DEF_COLOR}
          pokes={defenders}
          max={isTvM ? 12 : 6}
          addLabel={t("ui.add")}
          onEdit={(i) => setSlot({ list: dList, idx: i })}
          onRemove={(i) => removeFrom(dList, i)}
          onAdd={() => addTo(dList)}
        />
      </div>

      {slot && slotPoke && (
        <SideDrawer title={`${t("ui.editPrefix")} · ${slotPoke.name}`} icon="edit" onClose={() => setSlot(null)}>
          <PokemonPanel poke={slotPoke} side={slot.list === "team" ? "atk" : "def"} useChampions={useChampions} onChange={updSlot} />
        </SideDrawer>
      )}
    </div>
  )
}
