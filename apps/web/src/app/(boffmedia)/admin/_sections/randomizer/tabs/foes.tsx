"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SelectRow } from "../_components/controls/SelectRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { GatedNumberRow } from "../_components/controls/GatedNumberRow"
import { BattleStyleControl } from "../_components/controls/BattleStyleControl"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function FoesTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const trainersMod = useWatch({ control: form.control, name: "trainersMod" })
  const trainersLevelModified = useWatch({ control: form.control, name: "trainersLevelModified" })
  const trainersEvolveTheirPokemon = useWatch({
    control: form.control,
    name: "trainersEvolveTheirPokemon",
  })
  const totemLevelsModified = useWatch({ control: form.control, name: "totemLevelsModified" })

  // Species-selection modifiers only apply when trainer Pokémon are randomized.
  const speciesDisabled = trainersMod === "UNCHANGED"

  return (
    <div className="space-y-5">
      {/* Panel 1: Trainer Pokémon */}
      <AvPanel
        title={t("panels.trainerPokemon")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <SelectRow
            field="trainersMod"
            labelKey="opt.trainersMod.label"
            tipKey="opt.trainersMod.tip"
            options={[
              { value: "UNCHANGED", labelKey: "opt.trainersMod.UNCHANGED" },
              { value: "RANDOM", labelKey: "opt.trainersMod.RANDOM" },
              { value: "DISTRIBUTED", labelKey: "opt.trainersMod.DISTRIBUTED" },
              { value: "MAINPLAYTHROUGH", labelKey: "opt.trainersMod.MAINPLAYTHROUGH" },
              { value: "TYPE_THEMED", labelKey: "opt.trainersMod.TYPE_THEMED" },
              {
                value: "TYPE_THEMED_ELITE4_GYMS",
                labelKey: "opt.trainersMod.TYPE_THEMED_ELITE4_GYMS",
              },
              { value: "KEEP_THEMED", labelKey: "opt.trainersMod.KEEP_THEMED" },
              { value: "KEEP_THEME_OR_PRIMARY", labelKey: "opt.trainersMod.KEEP_THEME_OR_PRIMARY" },
            ]}
          />

          {/* Species-selection modifiers */}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="rivalCarriesStarterThroughout"
              labelKey="opt.rivalCarriesStarterThroughout.label"
              tipKey="opt.rivalCarriesStarterThroughout.tip"
            />
            <ToggleRow
              field="trainersUsePokemonOfSimilarStrength"
              labelKey="opt.trainersUsePokemonOfSimilarStrength.label"
              tipKey="opt.trainersUsePokemonOfSimilarStrength.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="trainersAvoidDuplicates"
              labelKey="opt.trainersAvoidDuplicates.label"
              tipKey="opt.trainersAvoidDuplicates.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="trainersMatchTypingDistribution"
              labelKey="opt.trainersMatchTypingDistribution.label"
              tipKey="opt.trainersMatchTypingDistribution.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="trainersUseLocalPokemon"
              labelKey="opt.trainersUseLocalPokemon.label"
              tipKey="opt.trainersUseLocalPokemon.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="trainersBlockLegendaries"
              labelKey="opt.trainersBlockLegendaries.label"
              tipKey="opt.trainersBlockLegendaries.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="trainersBlockEarlyWonderGuard"
              labelKey="opt.trainersBlockEarlyWonderGuard.label"
              tipKey="opt.trainersBlockEarlyWonderGuard.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="allowTrainerAlternateFormes"
              labelKey="opt.allowTrainerAlternateFormes.label"
              tipKey="opt.allowTrainerAlternateFormes.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="swapTrainerMegaEvos"
              labelKey="opt.swapTrainerMegaEvos.label"
              tipKey="opt.swapTrainerMegaEvos.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="shinyChance"
              labelKey="opt.shinyChance.label"
              tipKey="opt.shinyChance.tip"
            />
          </AvPanel>

          {/* Names, evolution, level */}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="randomizeTrainerNames"
              labelKey="opt.randomizeTrainerNames.label"
              tipKey="opt.randomizeTrainerNames.tip"
            />
            <ToggleRow
              field="randomizeTrainerClassNames"
              labelKey="opt.randomizeTrainerClassNames.label"
              tipKey="opt.randomizeTrainerClassNames.tip"
            />
            <ToggleRow
              field="trainersEvolveTheirPokemon"
              labelKey="opt.trainersEvolveTheirPokemon.label"
              tipKey="opt.trainersEvolveTheirPokemon.tip"
            />
            <SliderRow
              field="trainersEvolutionLevelModifier"
              labelKey="opt.trainersEvolutionLevelModifier.label"
              tipKey="opt.trainersEvolutionLevelModifier.tip"
              min={0}
              max={50}
              unit="%"
              disabled={!trainersEvolveTheirPokemon}
            />
            <ToggleRow
              field="trainersLevelModified"
              labelKey="opt.trainersLevelModified.label"
              tipKey="opt.trainersLevelModified.tip"
            />
            <SliderRow
              field="trainersLevelModifier"
              labelKey="opt.trainersLevelModifier.label"
              tipKey="opt.trainersLevelModifier.tip"
              min={-50}
              max={50}
              unit="%"
              disabled={!trainersLevelModified}
            />
            <GatedNumberRow
              field="eliteFourUniquePokemonNumber"
              labelKey="opt.eliteFourUniquePokemonNumber.label"
              tipKey="opt.eliteFourUniquePokemonNumber.tip"
              min={1}
              max={2}
              onValue={1}
            />
          </AvPanel>

          {/* Additional Pokémon per trainer tier */}
          <AvPanel className="bg-panel-2/50">
            <div className="space-y-3">
              <GatedNumberRow
                field="additionalBossTrainerPokemon"
                labelKey="opt.additionalBossTrainerPokemon.label"
                tipKey="opt.additionalBossTrainerPokemon.tip"
                min={1}
                max={5}
                onValue={1}
              />
              <GatedNumberRow
                field="additionalImportantTrainerPokemon"
                labelKey="opt.additionalImportantTrainerPokemon.label"
                tipKey="opt.additionalImportantTrainerPokemon.tip"
                min={1}
                max={5}
                onValue={1}
              />
              <GatedNumberRow
                field="additionalRegularTrainerPokemon"
                labelKey="opt.additionalRegularTrainerPokemon.label"
                tipKey="opt.additionalRegularTrainerPokemon.tip"
                min={1}
                max={5}
                onValue={1}
              />
            </div>
          </AvPanel>

          {/* Held items */}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="randomizeHeldItemsForBossTrainerPokemon"
              labelKey="opt.randomizeHeldItemsForBossTrainerPokemon.label"
              tipKey="opt.randomizeHeldItemsForBossTrainerPokemon.tip"
            />
            <ToggleRow
              field="randomizeHeldItemsForImportantTrainerPokemon"
              labelKey="opt.randomizeHeldItemsForImportantTrainerPokemon.label"
              tipKey="opt.randomizeHeldItemsForImportantTrainerPokemon.tip"
            />
            <ToggleRow
              field="randomizeHeldItemsForRegularTrainerPokemon"
              labelKey="opt.randomizeHeldItemsForRegularTrainerPokemon.label"
              tipKey="opt.randomizeHeldItemsForRegularTrainerPokemon.tip"
            />
            <ToggleRow
              field="consumableItemsOnlyForTrainerPokemon"
              labelKey="opt.consumableItemsOnlyForTrainerPokemon.label"
              tipKey="opt.consumableItemsOnlyForTrainerPokemon.tip"
            />
            <ToggleRow
              field="sensibleItemsOnlyForTrainerPokemon"
              labelKey="opt.sensibleItemsOnlyForTrainerPokemon.label"
              tipKey="opt.sensibleItemsOnlyForTrainerPokemon.tip"
            />
            <ToggleRow
              field="highestLevelOnlyGetsItemsForTrainerPokemon"
              labelKey="opt.highestLevelOnlyGetsItemsForTrainerPokemon.label"
              tipKey="opt.highestLevelOnlyGetsItemsForTrainerPokemon.tip"
            />
          </AvPanel>

          {/* Type diversity */}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="diverseTypesForBossTrainers"
              labelKey="opt.diverseTypesForBossTrainers.label"
              tipKey="opt.diverseTypesForBossTrainers.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="diverseTypesForImportantTrainers"
              labelKey="opt.diverseTypesForImportantTrainers.label"
              tipKey="opt.diverseTypesForImportantTrainers.tip"
              disabled={speciesDisabled}
            />
            <ToggleRow
              field="diverseTypesForRegularTrainers"
              labelKey="opt.diverseTypesForRegularTrainers.label"
              tipKey="opt.diverseTypesForRegularTrainers.tip"
              disabled={speciesDisabled}
            />
          </AvPanel>

          {/* Better movesets */}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="betterBossTrainerMovesets"
              labelKey="opt.betterBossTrainerMovesets.label"
              tipKey="opt.betterBossTrainerMovesets.tip"
            />
            <ToggleRow
              field="betterImportantTrainerMovesets"
              labelKey="opt.betterImportantTrainerMovesets.label"
              tipKey="opt.betterImportantTrainerMovesets.tip"
            />
            <ToggleRow
              field="betterRegularTrainerMovesets"
              labelKey="opt.betterRegularTrainerMovesets.label"
              tipKey="opt.betterRegularTrainerMovesets.tip"
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 2: Battle Style */}
      <AvPanel
        title={t("panels.battleStyle")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <BattleStyleControl />
      </AvPanel>

      {/* Panel 3: Totem / Ally / Aura Pokémon (Gen 7 only) */}
      <AvPanel
        title={t("panels.totemPokemon")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="totemPokemonMod"
            titleKey="panels.totemMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.totemPokemonMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.totemPokemonMod.RANDOM" },
              { value: "SIMILAR_STRENGTH", i18nKey: "opt.totemPokemonMod.SIMILAR_STRENGTH" },
            ]}
          />
          <RadioPanel
            field="allyPokemonMod"
            titleKey="panels.allyMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.allyPokemonMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.allyPokemonMod.RANDOM" },
              { value: "SIMILAR_STRENGTH", i18nKey: "opt.allyPokemonMod.SIMILAR_STRENGTH" },
            ]}
          />
          <RadioPanel
            field="auraMod"
            titleKey="panels.auraMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.auraMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.auraMod.RANDOM" },
              { value: "SAME_STRENGTH", i18nKey: "opt.auraMod.SAME_STRENGTH" },
            ]}
          />
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="randomizeTotemHeldItems"
              labelKey="opt.randomizeTotemHeldItems.label"
              tipKey="opt.randomizeTotemHeldItems.tip"
            />
            <ToggleRow
              field="allowTotemAltFormes"
              labelKey="opt.allowTotemAltFormes.label"
              tipKey="opt.allowTotemAltFormes.tip"
            />
            <ToggleRow
              field="totemLevelsModified"
              labelKey="opt.totemLevelsModified.label"
              tipKey="opt.totemLevelsModified.tip"
            />
            <SliderRow
              field="totemLevelModifier"
              labelKey="opt.totemLevelModifier.label"
              tipKey="opt.totemLevelModifier.tip"
              min={-50}
              max={50}
              unit="%"
              disabled={!totemLevelsModified}
            />
          </AvPanel>
        </div>
      </AvPanel>
    </div>
  )
}
