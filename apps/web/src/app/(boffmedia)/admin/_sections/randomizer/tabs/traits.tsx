"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SelectRow } from "../_components/controls/SelectRow"
import { NumberRow } from "../_components/controls/NumberRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function TraitsTab() {
  const t = useTranslations("admin.randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch fields to compute greying state
  const baseStatisticsMod = useWatch({
    control: form.control,
    name: "baseStatisticsMod",
  })
  const bstMod = useWatch({
    control: form.control,
    name: "bstMod",
  })
  const speciesTypesMod = useWatch({
    control: form.control,
    name: "speciesTypesMod",
  })
  const abilitiesMod = useWatch({
    control: form.control,
    name: "abilitiesMod",
  })
  const evolutionsMod = useWatch({
    control: form.control,
    name: "evolutionsMod",
  })
  const updateBaseStats = useWatch({
    control: form.control,
    name: "updateBaseStats",
  })
  const standardizeEXPCurves = useWatch({
    control: form.control,
    name: "standardizeEXPCurves",
  })

  // Generation options for updateBaseStatsToGeneration
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

  // EXP Curve options for selectedEXPCurve
  const expCurves = [
    { value: "FLAT", labelKey: "opt.expCurves.FLAT" },
    { value: "MEDIUM_FAST", labelKey: "opt.expCurves.MEDIUM_FAST" },
    { value: "MEDIUM_SLOW", labelKey: "opt.expCurves.MEDIUM_SLOW" },
    { value: "SLOW", labelKey: "opt.expCurves.SLOW" },
    { value: "FAST", labelKey: "opt.expCurves.FAST" },
    { value: "SLOW_THEN_VERY_FAST", labelKey: "opt.expCurves.SLOW_THEN_VERY_FAST" },
  ]

  return (
    <div className="space-y-5">
      {/* Panel 1: Pokemon Base Statistics (PBS) */}
      <AvPanel
        title={t("panels.baseStatistics")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="baseStatisticsMod"
            titleKey="panels.baseStatisticsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.baseStatisticsMod.UNCHANGED" },
              { value: "SHUFFLE", i18nKey: "opt.baseStatisticsMod.SHUFFLE" },
              { value: "RANDOM", i18nKey: "opt.baseStatisticsMod.RANDOM" },
            ]}
          />

          <RadioPanel
            field="bstMod"
            titleKey="panels.bstMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.bstMod.UNCHANGED" },
              { value: "RANDOM_BUFF_NERF", i18nKey: "opt.bstMod.RANDOM_BUFF_NERF" },
              { value: "SHUFFLE", i18nKey: "opt.bstMod.SHUFFLE" },
              { value: "RANDOM", i18nKey: "opt.bstMod.RANDOM" },
            ]}
            disabled={baseStatisticsMod === "UNCHANGED"}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="baseStatsFollowEvolutions"
              labelKey="opt.baseStatsFollowEvolutions.label"
              tipKey="opt.baseStatsFollowEvolutions.tip"
              disabled={baseStatisticsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="baseStatsFollowMegaEvolutions"
              labelKey="opt.baseStatsFollowMegaEvolutions.label"
              tipKey="opt.baseStatsFollowMegaEvolutions.tip"
              disabled={baseStatisticsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="assignEvoStatsRandomly"
              labelKey="opt.assignEvoStatsRandomly.label"
              tipKey="opt.assignEvoStatsRandomly.tip"
              disabled={baseStatisticsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="updateBaseStats"
              labelKey="opt.updateBaseStats.label"
              tipKey="opt.updateBaseStats.tip"
              disabled={baseStatisticsMod === "UNCHANGED"}
            />
          </AvPanel>

          <SelectRow
            field="updateBaseStatsToGeneration"
            labelKey="opt.updateBaseStatsToGeneration.label"
            tipKey="opt.updateBaseStatsToGeneration.tip"
            options={generations}
            disabled={baseStatisticsMod === "UNCHANGED" || !updateBaseStats}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="bstFollowEvolutions"
              labelKey="opt.bstFollowEvolutions.label"
              tipKey="opt.bstFollowEvolutions.tip"
              disabled={bstMod === "UNCHANGED"}
            />
            <ToggleRow
              field="bstShuffleSwapLegendaries"
              labelKey="opt.bstShuffleSwapLegendaries.label"
              tipKey="opt.bstShuffleSwapLegendaries.tip"
              disabled={bstMod === "UNCHANGED"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 2: Pokemon Types (PT) */}
      <AvPanel
        title={t("panels.types")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="speciesTypesMod"
            titleKey="panels.typesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.speciesTypesMod.UNCHANGED" },
              {
                value: "RANDOM_FOLLOW_EVOLUTIONS",
                i18nKey: "opt.speciesTypesMod.RANDOM_FOLLOW_EVOLUTIONS",
              },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.speciesTypesMod.COMPLETELY_RANDOM" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="typesFollowMegaEvolutions"
              labelKey="opt.typesFollowMegaEvolutions.label"
              tipKey="opt.typesFollowMegaEvolutions.tip"
              disabled={speciesTypesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="dualTypeOnly"
              labelKey="opt.dualTypeOnly.label"
              tipKey="opt.dualTypeOnly.tip"
              disabled={speciesTypesMod === "UNCHANGED"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 3: Pokemon Abilities (PA) */}
      <AvPanel
        title={t("panels.abilities")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="abilitiesMod"
            titleKey="panels.abilitiesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.abilitiesMod.UNCHANGED" },
              { value: "RANDOMIZE", i18nKey: "opt.abilitiesMod.RANDOMIZE" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="allowWonderGuard"
              labelKey="opt.allowWonderGuard.label"
              tipKey="opt.allowWonderGuard.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="banBadAbilities"
              labelKey="opt.banBadAbilities.label"
              tipKey="opt.banBadAbilities.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="banTrappingAbilities"
              labelKey="opt.banTrappingAbilities.label"
              tipKey="opt.banTrappingAbilities.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="banNegativeAbilities"
              labelKey="opt.banNegativeAbilities.label"
              tipKey="opt.banNegativeAbilities.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="weighDuplicateAbilitiesTogether"
              labelKey="opt.weighDuplicateAbilitiesTogether.label"
              tipKey="opt.weighDuplicateAbilitiesTogether.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="abilitiesFollowEvolutions"
              labelKey="opt.abilitiesFollowEvolutions.label"
              tipKey="opt.abilitiesFollowEvolutions.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
            <ToggleRow
              field="abilitiesFollowMegaEvolutions"
              labelKey="opt.abilitiesFollowMegaEvolutions.label"
              tipKey="opt.abilitiesFollowMegaEvolutions.tip"
              disabled={abilitiesMod === "UNCHANGED"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 4: Pokemon Evolutions (PE) */}
      <AvPanel
        title={t("panels.evolutions")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="evolutionsMod"
            titleKey="panels.evolutionsMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.evolutionsMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.evolutionsMod.RANDOM" },
              { value: "RANDOM_EVERY_LEVEL", i18nKey: "opt.evolutionsMod.RANDOM_EVERY_LEVEL" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="evosAllowAltFormes"
              labelKey="opt.evosAllowAltFormes.label"
              tipKey="opt.evosAllowAltFormes.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosForceChange"
              labelKey="opt.evosForceChange.label"
              tipKey="opt.evosForceChange.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="changeImpossibleEvolutions"
              labelKey="opt.changeImpossibleEvolutions.label"
              tipKey="opt.changeImpossibleEvolutions.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="makeEvolutionsEasier"
              labelKey="opt.makeEvolutionsEasier.label"
              tipKey="opt.makeEvolutionsEasier.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosMaxThreeStages"
              labelKey="opt.evosMaxThreeStages.label"
              tipKey="opt.evosMaxThreeStages.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosForceGrowth"
              labelKey="opt.evosForceGrowth.label"
              tipKey="opt.evosForceGrowth.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosNoConvergence"
              labelKey="opt.evosNoConvergence.label"
              tipKey="opt.evosNoConvergence.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosSameTyping"
              labelKey="opt.evosSameTyping.label"
              tipKey="opt.evosSameTyping.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="evosSimilarStrength"
              labelKey="opt.evosSimilarStrength.label"
              tipKey="opt.evosSimilarStrength.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="removeTimeBasedEvolutions"
              labelKey="opt.removeTimeBasedEvolutions.label"
              tipKey="opt.removeTimeBasedEvolutions.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
            <ToggleRow
              field="adjustEvolutionLevels"
              labelKey="opt.adjustEvolutionLevels.label"
              tipKey="opt.adjustEvolutionLevels.tip"
              disabled={evolutionsMod === "UNCHANGED"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 5: EXP Curves */}
      <AvPanel
        title={t("panels.expCurves")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="expCurveMod"
            titleKey="panels.expCurveMode"
            options={[
              { value: "LEGENDARIES", i18nKey: "opt.expCurveMod.LEGENDARIES" },
              { value: "STRONG_LEGENDARIES", i18nKey: "opt.expCurveMod.STRONG_LEGENDARIES" },
              { value: "ALL", i18nKey: "opt.expCurveMod.ALL" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="standardizeEXPCurves"
              labelKey="opt.standardizeEXPCurves.label"
              tipKey="opt.standardizeEXPCurves.tip"
            />
          </AvPanel>

          <SelectRow
            field="selectedEXPCurve"
            labelKey="opt.selectedEXPCurve.label"
            tipKey="opt.selectedEXPCurve.tip"
            options={expCurves}
            disabled={!standardizeEXPCurves}
          />
        </div>
      </AvPanel>
    </div>
  )
}
