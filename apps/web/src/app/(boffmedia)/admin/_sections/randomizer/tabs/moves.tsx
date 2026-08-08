"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SelectRow } from "../_components/controls/SelectRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function MovesTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch fields to compute greying state
  const updateMoves = useWatch({
    control: form.control,
    name: "updateMoves",
  })
  const movesetsMod = useWatch({
    control: form.control,
    name: "movesetsMod",
  })
  const startWithGuaranteedMoves = useWatch({
    control: form.control,
    name: "startWithGuaranteedMoves",
  })
  const movesetsForceGoodDamaging = useWatch({
    control: form.control,
    name: "movesetsForceGoodDamaging",
  })

  // Generation options for updateMovesToGeneration
  const generations = [
    { value: "1", labelKey: "opt.generations.gen1" },
    { value: "2", labelKey: "opt.generations.gen2" },
    { value: "3", labelKey: "opt.generations.gen3" },
    { value: "4", labelKey: "opt.generations.gen4" },
    { value: "5", labelKey: "opt.generations.gen5" },
    { value: "6", labelKey: "opt.generations.gen6" },
    { value: "7", labelKey: "opt.generations.gen7" },
    { value: "8", labelKey: "opt.generations.gen8" },
    { value: "9", labelKey: "opt.generations.gen9" },
  ]

  return (
    <div className="space-y-5">
      {/* Panel 1: Move Data */}
      <AvPanel
        title={t("panels.moveData")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <ToggleRow
            field="randomizeMovePowers"
            labelKey="opt.randomizeMovePowers.label"
            tipKey="opt.randomizeMovePowers.tip"
          />
          <ToggleRow
            field="randomizeMoveAccuracies"
            labelKey="opt.randomizeMoveAccuracies.label"
            tipKey="opt.randomizeMoveAccuracies.tip"
          />
          <ToggleRow
            field="randomizeMovePPs"
            labelKey="opt.randomizeMovePPs.label"
            tipKey="opt.randomizeMovePPs.tip"
          />
          <ToggleRow
            field="randomizeMoveTypes"
            labelKey="opt.randomizeMoveTypes.label"
            tipKey="opt.randomizeMoveTypes.tip"
          />
          <ToggleRow
            field="randomizeMoveNames"
            labelKey="opt.randomizeMoveNames.label"
            tipKey="opt.randomizeMoveNames.tip"
          />
          <ToggleRow
            field="randomizeMoveCategory"
            labelKey="opt.randomizeMoveCategory.label"
            tipKey="opt.randomizeMoveCategory.tip"
          />
          <ToggleRow
            field="updateMoves"
            labelKey="opt.updateMoves.label"
            tipKey="opt.updateMoves.tip"
          />
          <SelectRow
            field="updateMovesToGeneration"
            labelKey="opt.updateMovesToGeneration.label"
            tipKey="opt.updateMovesToGeneration.tip"
            options={generations}
            valueType="number"
            disabled={!updateMoves}
          />
        </div>
      </AvPanel>

      {/* Panel 2: Pokemon Movesets */}
      <AvPanel
        title={t("panels.pokemonMovesets")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="movesetsMod"
            titleKey="panels.pokemonMovesetsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.movesetsMod.UNCHANGED" },
              {
                value: "RANDOM_PREFER_SAME_TYPE",
                i18nKey: "opt.movesetsMod.RANDOM_PREFER_SAME_TYPE",
              },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.movesetsMod.COMPLETELY_RANDOM" },
              { value: "METRONOME_ONLY", i18nKey: "opt.movesetsMod.METRONOME_ONLY" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="startWithGuaranteedMoves"
              labelKey="opt.startWithGuaranteedMoves.label"
              tipKey="opt.startWithGuaranteedMoves.tip"
              disabled={movesetsMod === "UNCHANGED"}
            />
            <SliderRow
              field="guaranteedMoveCount"
              labelKey="opt.guaranteedMoveCount.label"
              tipKey="opt.guaranteedMoveCount.tip"
              min={1}
              max={4}
              disabled={movesetsMod === "UNCHANGED" || !startWithGuaranteedMoves}
            />
            <ToggleRow
              field="reorderDamagingMoves"
              labelKey="opt.reorderDamagingMoves.label"
              tipKey="opt.reorderDamagingMoves.tip"
              disabled={movesetsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="blockBrokenMovesetMoves"
              labelKey="opt.blockBrokenMovesetMoves.label"
              tipKey="opt.blockBrokenMovesetMoves.tip"
              disabled={movesetsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="movesetsForceGoodDamaging"
              labelKey="opt.movesetsForceGoodDamaging.label"
              tipKey="opt.movesetsForceGoodDamaging.tip"
              disabled={movesetsMod === "UNCHANGED"}
            />
            <SliderRow
              field="movesetsGoodDamagingPercent"
              labelKey="opt.movesetsGoodDamagingPercent.label"
              tipKey="opt.movesetsGoodDamagingPercent.tip"
              min={0}
              max={100}
              unit="%"
              disabled={movesetsMod === "UNCHANGED" || !movesetsForceGoodDamaging}
            />
            <ToggleRow
              field="evolutionMovesForAll"
              labelKey="opt.evolutionMovesForAll.label"
              tipKey="opt.evolutionMovesForAll.tip"
              disabled={movesetsMod === "UNCHANGED"}
            />
          </AvPanel>
        </div>
      </AvPanel>
    </div>
  )
}
