"use client"

import { useVgcT } from "../../i18n";
import { Combobox } from "./ui/Combobox"
import { NumberStepper } from "./ui/NumberStepper"
import { Select, CritToggle } from "./ui/controls"
import { TypeBadge } from "./ui/TypeBadge"
import { TYPE_NAMES_EN } from "./ui/theme"
import type { CalcMove } from "../_types/calculator"
import type { MoveData } from "../_hooks/usePokemonData"

const MOVE_TYPES: string[] = [...TYPE_NAMES_EN]

// move combobox + BP / type / category / crit.
export function MoveRow({
  move,
  idx,
  side,
  moveMap,
  moveNames,
  onChange,
}: {
  move: CalcMove
  idx: number
  side: "atk" | "def"
  moveMap: Map<string, MoveData>
  moveNames: string[]
  onChange: (move: CalcMove) => void
}) {
  const t = useVgcT("calc.panel")
  const getMoves = (q: string) =>
    moveNames
      .filter((n) => !q || n.toLowerCase().includes(q))
      .slice(0, 16)
      .map((n) => moveMap.get(n))
      .filter((m): m is MoveData => !!m)

  const catOptions = [
    { value: "Physical", label: t("categoryPhysical") },
    { value: "Special", label: t("categorySpecial") },
    { value: "Status", label: t("categoryStatus") },
  ]

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_100px_86px_62px_30px] items-center gap-[6px] max-[560px]:grid-cols-[minmax(0,1fr)_100px_30px]">
      <Combobox<MoveData>
        value={move.name}
        placeholder={t("movePlaceholder", { n: idx + 1 })}
        ariaLabel={t("movePlaceholder", { n: idx + 1 })}
        alignRight={side === "def"}
        getItems={getMoves}
        itemKey={(it) => it.name}
        onPick={(it) => onChange({ name: it.name, bp: it.basePower, type: it.type, category: it.category, crit: move.crit })}
        renderItem={(it) => (
          <>
            <TypeBadge type={it.type} small />
            <span>{it.name}</span>
            <span className="tail">{it.basePower || "—"}</span>
          </>
        )}
      />
      <NumberStepper value={move.bp} min={0} max={250} step={5} ariaLabel={t("basePower")} onChange={(v) => onChange({ ...move, bp: v })} />
      <div className="max-[560px]:hidden">
        <Select value={move.type} options={MOVE_TYPES} ariaLabel="Type" onChange={(v) => onChange({ ...move, type: v })} />
      </div>
      <div className="max-[560px]:hidden">
        <Select
          value={move.category}
          options={catOptions}
          ariaLabel="Category"
          onChange={(v) => onChange({ ...move, category: v as CalcMove["category"] })}
        />
      </div>
      <CritToggle on={move.crit} title="Crit" onClick={() => onChange({ ...move, crit: !move.crit })} />
    </div>
  )
}
