"use client"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { useTranslations } from "next-intl"

interface PaletteInfo {
  name: string
  sprite?: string
}

interface PalettesSectionProps {
  palettes?: PaletteInfo[][]
  pokemonIndex: number
  formName: string
}

export function PalettesSection({ palettes, pokemonIndex, formName }: PalettesSectionProps) {
  const t = useTranslations("pokedex")

  if (!palettes || palettes.length === 0 || palettes.every((p) => p.length === 0)) {
    return null
  }

  const allPalettes = palettes.flat()
  const uniquePalettes = allPalettes.filter(
    (palette, index, self) => index === self.findIndex((p) => p.name === palette.name)
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-orbitron font-bold text-[17px] tracking-tight text-surface-50 flex items-center gap-2.5">
          <span className="font-jetbrains text-[10px] text-surface-500 tracking-[0.12em]">08</span>
          {t("entry_tab_variants")}
        </h3>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
        {uniquePalettes.map((palette, idx) => {
          const isShiny = palette.name === "shiny"
          return (
            <div
              key={idx}
              className={`bg-white/[0.02] border rounded-xl p-3.5 flex flex-col items-center gap-2 cursor-pointer transition-all hover:-translate-y-0.5 ${
                isShiny
                  ? "border-accent-300/30 hover:border-accent-300/60 hover:bg-accent-300/[0.05]"
                  : "border-white/[0.05] hover:border-primary-400/30 hover:bg-primary-400/[0.03]"
              }`}
            >
              <PokemonSprite
                width={64}
                height={64}
                id={pokemonIndex}
                form={formName}
                palette={palette.name}
                hide={true}
                showStatus={false}
                pixelated={true}
              />
              <span className="text-xs text-surface-200 font-medium">{t(`palette_${palette.name}`)}</span>
              <span className="absolute top-2 right-2 font-jetbrains text-[9px] tracking-widest text-surface-500">
                {palette.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
