"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function WildTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch fields to compute greying state
  const randomizeWildPokemon = useWatch({
    control: form.control,
    name: "randomizeWildPokemon",
  })
  const randomizeWildPokemonHeldItems = useWatch({
    control: form.control,
    name: "randomizeWildPokemonHeldItems",
  })
  const useMinimumCatchRate = useWatch({
    control: form.control,
    name: "useMinimumCatchRate",
  })
  const wildLevelsModified = useWatch({
    control: form.control,
    name: "wildLevelsModified",
  })

  const speciesDisabled = !randomizeWildPokemon

  return (
    <div className="space-y-5">
      {/* Panel 1: Wild Pokemon */}
      <AvPanel
        title={t("panels.wildPokemon")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <ToggleRow
            field="randomizeWildPokemon"
            labelKey="opt.randomizeWildPokemon.label"
            tipKey="opt.randomizeWildPokemon.tip"
          />
          <ToggleRow
            field="useTimeBasedEncounters"
            labelKey="opt.useTimeBasedEncounters.label"
            tipKey="opt.useTimeBasedEncounters.tip"
          />
          <ToggleRow
            field="blockWildLegendaries"
            labelKey="opt.blockWildLegendaries.label"
            tipKey="opt.blockWildLegendaries.tip"
            disabled={speciesDisabled}
          />
          <ToggleRow
            field="randomizeWildPokemonHeldItems"
            labelKey="opt.randomizeWildPokemonHeldItems.label"
            tipKey="opt.randomizeWildPokemonHeldItems.tip"
          />
          <ToggleRow
            field="banBadRandomWildPokemonHeldItems"
            labelKey="opt.banBadRandomWildPokemonHeldItems.label"
            tipKey="opt.banBadRandomWildPokemonHeldItems.tip"
            disabled={!randomizeWildPokemonHeldItems}
          />
          <ToggleRow
            field="allowWildAltFormes"
            labelKey="opt.allowWildAltFormes.label"
            tipKey="opt.allowWildAltFormes.tip"
            disabled={speciesDisabled}
          />
        </div>
      </AvPanel>

      {/* Panel 2: Type Restrictions */}
      <AvPanel
        title={t("panels.wildTypeRestrictions")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="wildPokemonTypeMod"
            titleKey="panels.wildTypeRestrictionsMode"
            options={[
              { value: "NONE", i18nKey: "opt.wildPokemonTypeMod.NONE" },
              { value: "KEEP_PRIMARY", i18nKey: "opt.wildPokemonTypeMod.KEEP_PRIMARY" },
              { value: "RANDOM_THEMES", i18nKey: "opt.wildPokemonTypeMod.RANDOM_THEMES" },
            ]}
            disabled={speciesDisabled}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="keepWildTypeThemes"
              labelKey="opt.keepWildTypeThemes.label"
              tipKey="opt.keepWildTypeThemes.tip"
              disabled={speciesDisabled}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 3: Encounter Grouping */}
      <AvPanel
        title={t("panels.encounterGrouping")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="wildPokemonZoneMod"
            titleKey="panels.encounterGroupingMode"
            options={[
              { value: "NONE", i18nKey: "opt.wildPokemonZoneMod.NONE" },
              { value: "GAME", i18nKey: "opt.wildPokemonZoneMod.GAME" },
              { value: "NAMED_LOCATION", i18nKey: "opt.wildPokemonZoneMod.NAMED_LOCATION" },
              { value: "MAP", i18nKey: "opt.wildPokemonZoneMod.MAP" },
              { value: "ENCOUNTER_SET", i18nKey: "opt.wildPokemonZoneMod.ENCOUNTER_SET" },
            ]}
            disabled={speciesDisabled}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="splitWildZoneByEncounterTypes"
              labelKey="opt.splitWildZoneByEncounterTypes.label"
              tipKey="opt.splitWildZoneByEncounterTypes.tip"
              disabled={speciesDisabled}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 4: Evolution Restrictions */}
      <AvPanel
        title={t("panels.evolutionRestrictions")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="wildPokemonEvolutionMod"
            titleKey="panels.evolutionRestrictionsMode"
            options={[
              { value: "NONE", i18nKey: "opt.wildPokemonEvolutionMod.NONE" },
              { value: "BASIC_ONLY", i18nKey: "opt.wildPokemonEvolutionMod.BASIC_ONLY" },
              { value: "KEEP_STAGE", i18nKey: "opt.wildPokemonEvolutionMod.KEEP_STAGE" },
            ]}
            disabled={speciesDisabled}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="keepWildEvolutionFamilies"
              labelKey="opt.keepWildEvolutionFamilies.label"
              tipKey="opt.keepWildEvolutionFamilies.tip"
              disabled={speciesDisabled}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 5: Catch & Level */}
      <AvPanel
        title={t("panels.wildCatchLevel")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <ToggleRow
            field="useMinimumCatchRate"
            labelKey="opt.useMinimumCatchRate.label"
            tipKey="opt.useMinimumCatchRate.tip"
          />
          <SliderRow
            field="minimumCatchRateLevel"
            labelKey="opt.minimumCatchRateLevel.label"
            tipKey="opt.minimumCatchRateLevel.tip"
            min={1}
            max={5}
            disabled={!useMinimumCatchRate}
          />

          <ToggleRow
            field="wildLevelsModified"
            labelKey="opt.wildLevelsModified.label"
            tipKey="opt.wildLevelsModified.tip"
          />
          <SliderRow
            field="wildLevelModifier"
            labelKey="opt.wildLevelModifier.label"
            tipKey="opt.wildLevelModifier.tip"
            min={-50}
            max={50}
            unit="%"
            disabled={!wildLevelsModified}
          />

          <ToggleRow
            field="catchEmAllEncounters"
            labelKey="opt.catchEmAllEncounters.label"
            tipKey="opt.catchEmAllEncounters.tip"
            disabled={speciesDisabled}
          />
          <ToggleRow
            field="similarStrengthEncounters"
            labelKey="opt.similarStrengthEncounters.label"
            tipKey="opt.similarStrengthEncounters.tip"
            disabled={speciesDisabled}
          />
          <ToggleRow
            field="balanceShakingGrass"
            labelKey="opt.balanceShakingGrass.label"
            tipKey="opt.balanceShakingGrass.tip"
            disabled={speciesDisabled}
          />
        </div>
      </AvPanel>
    </div>
  )
}
