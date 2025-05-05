"use client"
import { PokemonSprite } from "../../../_components/PokemonSprite"
import { InternalLink } from "@/components/nav/Link"
import { getForm, getDisplayStatus } from "../../../dexUtils"
import { useTranslations } from "next-intl"
import { PokedexSection } from "../../../_components/PokedexSection"
import { Pokemon } from "@/types/Pokemon"

interface FormsSectionProps {
  pokemon: Pokemon
  pokemonIndex: number
  formIndex: number
}

export function FormsSection({ pokemon, pokemonIndex, formIndex }: FormsSectionProps) {
  const t = useTranslations("pokedex")
  
  if (pokemon.forms.length <= 1) {
    return null
  }
  
  return (
    <PokedexSection id='forms' title="Formas Alternativas">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
        {pokemon.forms.map((form, index) => {
          const isCurrentForm = index === formIndex
          const formName = form.name || 'base'
          const isVisible = getDisplayStatus(pokemonIndex, formName, true)

          return (
            <InternalLink key={formName} 
              href={`/pokedex/entrada/${pokemon.dex}/${index + 1}#forms`}
              className={`block w-full max-w-[150px] ${isCurrentForm ? 'pointer-events-none' : ''}`}
            >
              <div className={`flex flex-col justify-center items-center p-3 rounded-lg transition-all
                ${isCurrentForm 
                  ? 'bg-primary-700/30 border-2 border-primary-400' 
                  : 'bg-surface-700/30 border border-surface-600 hover:bg-surface-600/70 hover:border-surface-500'}`}
              >
                <PokemonSprite 
                  width={100} 
                  height={100} 
                  id={pokemonIndex} 
                  form={formName} 
                  palette='none'
                  hide={!isVisible}
                  className={isCurrentForm ? 'drop-shadow-glow-primary' : ''}
                  url={form.spriteUrl}
                />
                <span className="mt-2 font-medium text-center">
                  {isVisible ? (getForm(formName, t) || 'Base') : '???'}
                </span>
              </div>
            </InternalLink>
          )
        })}
      </div>
    </PokedexSection>
  )
}