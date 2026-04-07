"use client"
import { PokedexSection } from "../../../_components/PokedexSection"
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
  
  if (!palettes || palettes.length === 0 || palettes.every(p => p.length === 0)) {
    return null
  }
  
  // Flatten all palettes into a single array, removing duplicates
  const allPalettes = palettes.flat()
  const uniquePalettes = allPalettes.filter((palette, index, self) => 
    index === self.findIndex((p) => p.name === palette.name)
  )
  
  return (
    <PokedexSection id='palettes' title="Variantes">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 justify-items-center">
          {uniquePalettes.map((palette, idx) => {
            return <div key={idx} className="flex flex-col justify-center items-center p-3 bg-surface-800/50 rounded-lg border border-surface-700/50 hover:border-surface-600 transition-colors">
              <PokemonSprite
                width={80} 
                height={80} 
                id={pokemonIndex} 
                form={formName} 
                palette={palette.name} 
                hide={true} 
                showStatus={false}
              />
              <span className="mt-2 text-sm text-center">
                {t(`palette_${palette.name}`)}
              </span>
            </div>
})}
        </div>
    </PokedexSection>
  )
}