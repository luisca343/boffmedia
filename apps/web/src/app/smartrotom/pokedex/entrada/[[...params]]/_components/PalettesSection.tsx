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

  if (!palettes || palettes.length === 0 || palettes.every((p) => p.length === 0)) return null

  const allPalettes = palettes.flat()
  const uniquePalettes = allPalettes.filter((palette, index, self) => index === self.findIndex((p) => p.name === palette.name))

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5">
      {uniquePalettes.map((palette, idx) => {
        const isShiny = palette.name === "shiny"
        return (
          <div
            key={idx}
            className={`relative bg-white/[0.02] border rounded-xl p-[14px_8px] flex flex-col items-center gap-2 cursor-pointer transition-all ${
              isShiny
                ? "border-pk-accent-300/30 hover:border-pk-accent-300/60 hover:bg-pk-accent-300/[0.05]"
                : "border-white/[0.05] hover:border-pk-primary-400/30 hover:bg-pk-primary-400/[0.03]"
            }`}
          >
            <span className="absolute top-2 right-2 font-pk-mono text-[0.5625rem] tracking-[0.08em] text-pk-surface-500">{palette.name}</span>
            <PokemonSprite
              width={64}
              height={64}
              id={pokemonIndex}
              form={formName}
              palette={palette.name}
              hide={true}
              showStatus={false}
              pixelated={true}
              className="drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
            />
            <span className="text-xs text-pk-surface-200 font-medium">{t(`palette_${palette.name}`)}</span>
          </div>
        )
      })}
    </div>
  )
}
