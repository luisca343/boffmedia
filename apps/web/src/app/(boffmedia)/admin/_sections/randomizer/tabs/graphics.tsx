"use client"

import { useFormContext, useWatch } from "react-hook-form"
import { useTranslations } from "next-intl"
import { AvPanel } from "../../../_components/ui/av-kit"
import { RadioPanel } from "../_components/controls/RadioPanel"
import { ToggleRow } from "../_components/controls/ToggleRow"
import { RandomizerSettings } from "@boffmedia/pack-schema"

export default function GraphicsTab() {
  const t = useTranslations("randomizer")
  const form = useFormContext<RandomizerSettings>()

  // Watch field to compute greying state
  const pokemonPalettesMod = useWatch({
    control: form.control,
    name: "pokemonPalettesMod",
  })

  return (
    <div className="space-y-5">
      {/* Panel 1: Pokémon Palettes */}
      <AvPanel
        title={t("panels.pokemonPalettes")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <div className="space-y-4">
          <RadioPanel
            field="pokemonPalettesMod"
            titleKey="panels.pokemonPalettesMode"
            options={[
              { value: "UNCHANGED", i18nKey: "opt.pokemonPalettesMod.UNCHANGED" },
              { value: "RANDOM", i18nKey: "opt.pokemonPalettesMod.RANDOM" },
            ]}
          />

          <AvPanel className="bg-panel-2/50">
            <ToggleRow
              field="pokemonPalettesFollowTypes"
              labelKey="opt.pokemonPalettesFollowTypes.label"
              tipKey="opt.pokemonPalettesFollowTypes.tip"
              disabled={pokemonPalettesMod !== "RANDOM"}
            />
            <ToggleRow
              field="pokemonPalettesFollowEvolutions"
              labelKey="opt.pokemonPalettesFollowEvolutions.label"
              tipKey="opt.pokemonPalettesFollowEvolutions.tip"
              disabled={pokemonPalettesMod !== "RANDOM"}
            />
            <ToggleRow
              field="pokemonPalettesShinyFromNormal"
              labelKey="opt.pokemonPalettesShinyFromNormal.label"
              tipKey="opt.pokemonPalettesShinyFromNormal.tip"
              disabled={pokemonPalettesMod !== "RANDOM"}
            />
          </AvPanel>
        </div>
      </AvPanel>

      {/* Panel 2: Custom Player Graphics (stub) */}
      <AvPanel
        title={t("panels.customPlayerGraphics")}
        className="border-l-[3px] border-l-accent bg-accent-soft/10"
      >
        <p className="text-sm text-txt-muted">
          {t("chrome.cpgStub")}
        </p>
      </AvPanel>
    </div>
  )
}
