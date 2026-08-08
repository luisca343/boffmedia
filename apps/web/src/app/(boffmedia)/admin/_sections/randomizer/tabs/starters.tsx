"use client"

import { Controller, useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Select, Field, Input } from "@boffmedia/ui"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { SelectRow } from "../_components/controls/SelectRow"
import { SliderRow } from "../_components/controls/SliderRow"
import { GatedNumberRow } from "../_components/controls/GatedNumberRow"
import { InfoTooltip } from "../_components/controls/InfoTooltip"
import { RandomizerSettings } from "@boffmedia/pack-schema"

const POKEMON_TYPES = [
  "NORMAL", "FIGHTING", "FLYING", "GRASS", "WATER", "FIRE", "ROCK", "GROUND",
  "PSYCHIC", "BUG", "DRAGON", "ELECTRIC", "GHOST", "POISON", "ICE", "STEEL",
  "DARK", "FAIRY",
]

const RANDOM_TYPE_SENTINEL = "__RANDOM__"

/**
 * One custom-starter species picker. FVX shows a species combo; the web app has
 * no game-agnostic species-name list (that comes from `caps` per game, out of
 * scope), so this binds the raw species id as a numeric stepper — it round-trips
 * to `.rnqs` correctly. Bound to `customStarters[index]` (kept length-3).
 */
function CustomStarterStepper({ index }: { index: number }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  return (
    <Controller
      control={form.control}
      name={`customStarters.${index}` as "customStarters.0"}
      render={({ field: { value, onChange } }) => (
        <Field
          label={
            <div className="flex items-center gap-2">
              <span>{t(`opt.customStarter.label${index + 1}`)}</span>
              <InfoTooltip tipKey="opt.customStarter.tip" />
            </div>
          }
        >
          <Input
            type="number"
            min={0}
            value={typeof value === "number" ? value : 0}
            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          />
        </Field>
      )}
    />
  )
}

/** Single-type restriction select — nullable enum with a "Random" (null) option. */
function StartersSingleTypeSelect({ disabled }: { disabled?: boolean }) {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()
  const options = [
    { value: RANDOM_TYPE_SENTINEL, label: t("opt.startersSingleType.RANDOM") },
    ...POKEMON_TYPES.map((ty) => ({ value: ty, label: t(`opt.pokemonTypes.${ty}`) })),
  ]
  return (
    <Controller
      control={form.control}
      name="startersSingleType"
      render={({ field: { value, onChange } }) => (
        <Field
          label={
            <div className="flex items-center gap-2">
              <span>{t("opt.startersSingleType.label")}</span>
              <InfoTooltip tipKey="opt.startersSingleType.tip" />
            </div>
          }
        >
          <Select
            value={value == null ? RANDOM_TYPE_SENTINEL : String(value)}
            onChange={(v) => onChange(v === RANDOM_TYPE_SENTINEL ? null : v)}
            options={options}
            disabled={disabled}
          />
        </Field>
      )}
    />
  )
}

export default function StartersTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  const startersMod = useWatch({ control: form.control, name: "startersMod" })
  const startersTypeMod = useWatch({ control: form.control, name: "startersTypeMod" })
  const randomizeStartersHeldItems = useWatch({
    control: form.control,
    name: "randomizeStartersHeldItems",
  })
  const staticPokemonMod = useWatch({ control: form.control, name: "staticPokemonMod" })
  const staticLevelModified = useWatch({ control: form.control, name: "staticLevelModified" })
  const inGameTradesMod = useWatch({ control: form.control, name: "inGameTradesMod" })

  const isRandomStarters =
    startersMod === "COMPLETELY_RANDOM" ||
    startersMod === "RANDOM_WITH_TWO_EVOLUTIONS" ||
    startersMod === "RANDOM_BASIC"
  const staticUnchanged = staticPokemonMod === "UNCHANGED"
  const tradesUnchanged = inGameTradesMod === "UNCHANGED"

  return (
    <div className="space-y-5">
      {/* Panel 1: Starter Pokémon */}
      <AvPanel
        title={t("panels.starterPokemon")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="startersMod"
            titleKey="panels.starterMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.startersMod.UNCHANGED" },
              { value: "CUSTOM", i18nKey: "opt.startersMod.CUSTOM" },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.startersMod.COMPLETELY_RANDOM" },
              {
                value: "RANDOM_WITH_TWO_EVOLUTIONS",
                i18nKey: "opt.startersMod.RANDOM_WITH_TWO_EVOLUTIONS",
              },
              { value: "RANDOM_BASIC", i18nKey: "opt.startersMod.RANDOM_BASIC" },
            ]}
          />

          {startersMod === "CUSTOM" && (
            <AvPanel className="bg-panel-2/50">
              <div className="space-y-3">
                <CustomStarterStepper index={0} />
                <CustomStarterStepper index={1} />
                <CustomStarterStepper index={2} />
              </div>
            </AvPanel>
          )}
        </div>
      </AvPanel>

      {/* Panel 2: Type Restrictions */}
      <AvPanel
        title={t("panels.typeRestrictions")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="startersTypeMod"
            titleKey="panels.typeRestrictionsMode"
            options={[
              { value: "NONE", i18nKey: "opt.startersTypeMod.NONE" },
              { value: "FIRE_WATER_GRASS", i18nKey: "opt.startersTypeMod.FIRE_WATER_GRASS" },
              { value: "TRIANGLE", i18nKey: "opt.startersTypeMod.TRIANGLE" },
              { value: "UNIQUE", i18nKey: "opt.startersTypeMod.UNIQUE" },
              { value: "SINGLE_TYPE", i18nKey: "opt.startersTypeMod.SINGLE_TYPE" },
            ]}
            disabled={!isRandomStarters}
          />
          {startersTypeMod === "SINGLE_TYPE" && (
            <StartersSingleTypeSelect disabled={!isRandomStarters} />
          )}
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="startersNoDualTypes"
              labelKey="opt.startersNoDualTypes.label"
              tipKey="opt.startersNoDualTypes.tip"
              disabled={!isRandomStarters}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 3: Starter Pokémon (modifiers) */}
      <AvPanel
        title={t("panels.starterModifiers")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <ToggleRow
            field="allowStarterAltFormes"
            labelKey="opt.allowStarterAltFormes.label"
            tipKey="opt.allowStarterAltFormes.tip"
            disabled={!isRandomStarters}
          />
          <ToggleRow
            field="startersNoLegendaries"
            labelKey="opt.startersNoLegendaries.label"
            tipKey="opt.startersNoLegendaries.tip"
            disabled={!isRandomStarters}
          />
          <GatedNumberRow
            field="startersBSTMinimum"
            labelKey="opt.startersBSTMinimum.label"
            tipKey="opt.startersBSTMinimum.tip"
            min={1}
            max={1530}
            onValue={300}
            disabled={!isRandomStarters}
          />
          <GatedNumberRow
            field="startersBSTMaximum"
            labelKey="opt.startersBSTMaximum.label"
            tipKey="opt.startersBSTMaximum.tip"
            min={1}
            max={1530}
            onValue={600}
            disabled={!isRandomStarters}
          />
          <ToggleRow
            field="randomizeStartersHeldItems"
            labelKey="opt.randomizeStartersHeldItems.label"
            tipKey="opt.randomizeStartersHeldItems.tip"
          />
          <ToggleRow
            field="banBadRandomStarterHeldItems"
            labelKey="opt.banBadRandomStarterHeldItems.label"
            tipKey="opt.banBadRandomStarterHeldItems.tip"
            disabled={!randomizeStartersHeldItems}
          />
        </div>
      </AvPanel>

      {/* Panel 4: Static Pokémon */}
      <AvPanel
        title={t("panels.staticPokemon")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="staticPokemonMod"
            titleKey="panels.staticPokemonMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.staticPokemonMod.UNCHANGED" },
              { value: "RANDOM_MATCHING", i18nKey: "opt.staticPokemonMod.RANDOM_MATCHING" },
              { value: "COMPLETELY_RANDOM", i18nKey: "opt.staticPokemonMod.COMPLETELY_RANDOM" },
              { value: "SIMILAR_STRENGTH", i18nKey: "opt.staticPokemonMod.SIMILAR_STRENGTH" },
            ]}
          />
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="swapStaticMegaEvos"
              labelKey="opt.swapStaticMegaEvos.label"
              tipKey="opt.swapStaticMegaEvos.tip"
              disabled={staticUnchanged}
            />
            <ToggleRow
              field="limit600"
              labelKey="opt.limit600.label"
              tipKey="opt.limit600.tip"
              disabled={staticUnchanged}
            />
            <ToggleRow
              field="allowStaticAltFormes"
              labelKey="opt.allowStaticAltFormes.label"
              tipKey="opt.allowStaticAltFormes.tip"
              disabled={staticUnchanged}
            />
            <ToggleRow
              field="limitMainGameLegendaries"
              labelKey="opt.limitMainGameLegendaries.label"
              tipKey="opt.limitMainGameLegendaries.tip"
              disabled={staticUnchanged}
            />
            <ToggleRow
              field="correctStaticMusic"
              labelKey="opt.correctStaticMusic.label"
              tipKey="opt.correctStaticMusic.tip"
              disabled={staticUnchanged}
            />
            <ToggleRow
              field="staticLevelModified"
              labelKey="opt.staticLevelModified.label"
              tipKey="opt.staticLevelModified.tip"
            />
            <SliderRow
              field="staticLevelModifier"
              labelKey="opt.staticLevelModifier.label"
              tipKey="opt.staticLevelModifier.tip"
              min={-50}
              max={50}
              unit="%"
              disabled={!staticLevelModified}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 5: In-Game Trades */}
      <AvPanel
        title={t("panels.inGameTrades")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="inGameTradesMod"
            titleKey="panels.inGameTradesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.inGameTradesMod.UNCHANGED" },
              { value: "RANDOMIZE_GIVEN", i18nKey: "opt.inGameTradesMod.RANDOMIZE_GIVEN" },
              {
                value: "RANDOMIZE_GIVEN_AND_REQUESTED",
                i18nKey: "opt.inGameTradesMod.RANDOMIZE_GIVEN_AND_REQUESTED",
              },
            ]}
          />
          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="randomizeInGameTradesNicknames"
              labelKey="opt.randomizeInGameTradesNicknames.label"
              tipKey="opt.randomizeInGameTradesNicknames.tip"
              disabled={tradesUnchanged}
            />
            <ToggleRow
              field="randomizeInGameTradesOTs"
              labelKey="opt.randomizeInGameTradesOTs.label"
              tipKey="opt.randomizeInGameTradesOTs.tip"
              disabled={tradesUnchanged}
            />
            <ToggleRow
              field="randomizeInGameTradesIVs"
              labelKey="opt.randomizeInGameTradesIVs.label"
              tipKey="opt.randomizeInGameTradesIVs.tip"
              disabled={tradesUnchanged}
            />
            <ToggleRow
              field="randomizeInGameTradesItems"
              labelKey="opt.randomizeInGameTradesItems.label"
              tipKey="opt.randomizeInGameTradesItems.tip"
              disabled={tradesUnchanged}
            />
          </AvPanel>
        </div>
      </AvPanel>
    </div>
  )
}
