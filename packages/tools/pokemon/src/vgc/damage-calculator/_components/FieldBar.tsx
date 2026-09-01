"use client"

import { useVgcT } from "../../i18n";
import { TogglePill } from "./ui/TogglePill"
import { ATK_COLOR, DEF_COLOR } from "./ui/theme"
import type { CalcField, SideConditions } from "../_types/calculator"

const WEATHERS = ["Sun", "Rain", "Sand", "Snow"] as const
const TERRAINS = ["Electric", "Grassy", "Psychic", "Misty"] as const

interface Props {
  field: CalcField
  setField: (patch: Partial<CalcField>) => void
  setAtkSide: (patch: Partial<SideConditions>) => void
  setDefSide: (patch: Partial<SideConditions>) => void
}

// compact field controls for the matrix view.
export function FieldBar({ field, setField, setAtkSide, setDefSide }: Props) {
  const t = useVgcT("calc.field")
  const Divider = () => <span className="w-px self-stretch bg-line" aria-hidden="true" />
  return (
    <div className="mb-4 flex flex-wrap items-center gap-[10px] border border-solid border-line bg-panel px-[14px] py-[10px]">
      <div className="flex flex-wrap gap-[5px]" role="group" aria-label={t("format")}>
        <TogglePill on={field.format === "Doubles"} label={t("doubles")} onClick={() => setField({ format: "Doubles" })} />
        <TogglePill on={field.format === "Singles"} label={t("singles")} onClick={() => setField({ format: "Singles" })} />
      </div>
      <Divider />
      <div className="flex flex-wrap gap-[5px]" role="group" aria-label={t("weather")}>
        {WEATHERS.map((w) => (
          <TogglePill key={w} on={field.weather === w} label={t(`weathers.${w}`)} onClick={() => setField({ weather: field.weather === w ? "None" : w })} />
        ))}
      </div>
      <Divider />
      <div className="flex flex-wrap gap-[5px]" role="group" aria-label={t("terrain")}>
        {TERRAINS.map((tr) => (
          <TogglePill key={tr} on={field.terrain === tr} label={t(`terrains.${tr}`)} onClick={() => setField({ terrain: field.terrain === tr ? "None" : tr })} />
        ))}
      </div>
      <Divider />
      <div className="flex flex-wrap gap-[5px]" role="group" aria-label={t("conditions")}>
        <TogglePill on={field.trickRoom} label={t("pill.Trick Room")} onClick={() => setField({ trickRoom: !field.trickRoom })} />
        <TogglePill on={field.attackerSide.helpingHand} label={t("pill.Helping Hand")} tone={ATK_COLOR} onClick={() => setAtkSide({ helpingHand: !field.attackerSide.helpingHand })} />
        <TogglePill on={field.attackerSide.tailwind} label={t("pill.Tailwind")} tone={ATK_COLOR} onClick={() => setAtkSide({ tailwind: !field.attackerSide.tailwind })} />
        <TogglePill on={field.defenderSide.reflect} label={t("pill.Reflect")} tone={DEF_COLOR} onClick={() => setDefSide({ reflect: !field.defenderSide.reflect })} />
        <TogglePill on={field.defenderSide.lightScreen} label={t("pill.Light Screen")} tone={DEF_COLOR} onClick={() => setDefSide({ lightScreen: !field.defenderSide.lightScreen })} />
      </div>
    </div>
  )
}
