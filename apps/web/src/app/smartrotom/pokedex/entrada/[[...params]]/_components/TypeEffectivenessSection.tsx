import { PokedexSection } from "../../../_components/PokedexSection"
import { TypeTable } from "./TypeTable"
import { getPokemonDefense, getPokemonCoverage } from "../../../dexUtils"

interface TypeEffectivenessSectionProps {
  type1?: string
  type2?: string
}

export function TypeEffectivenessSection({ type1, type2 }: TypeEffectivenessSectionProps) {
  return (
    <PokedexSection id='typedata' title="Efectividades">
      <div className="flex flex-col md:flex-row justify-center gap-4">
        <TypeTable 
          className="md:w-[48%] w-full" 
          list={getPokemonDefense(type1!, type2)} 
          title="Daño Recibido" 
          id='defensive'
        />
        <TypeTable 
          className="md:w-[48%] w-full" 
          list={getPokemonCoverage(type1!, type2)} 
          title="Daño Realizado" 
          id='offensive'
        />
      </div>
    </PokedexSection>
  )
}