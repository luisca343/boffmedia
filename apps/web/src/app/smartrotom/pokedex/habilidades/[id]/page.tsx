"use client"
import { useState } from "react"
import AbilityDataElement from "../_components/AbilityData"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { useGetPokemonByAbility } from "@/hooks/pokemon/useGetPokemonByAbility"
import { useGetAbility } from "@/hooks/pokemon/useGetAbility"
import { ArrowLeftIcon, BookOpenIcon, SparklesIcon } from "@heroicons/react/24/outline"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"

export default function Habilidad({params} : {params: {id: string}}){
  const { id } = params
  const { pokemon } = useGetPokemonByAbility(id)
  const { ability } = useGetAbility(id)
  const t = useTranslations("pokedex")
  const [showAll, setShowAll] = useState(false)
  
  const displayLimit = 50
  const displayedPokemon = showAll ? pokemon : pokemon?.slice(0, displayLimit)
  const hasMoreToShow = pokemon && pokemon.length > displayLimit

  if(!ability) {
    return (
      <div className="bg-layer-2 min-h-full overflow-auto flex justify-center items-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
          <div className="text-ink text-xl">Cargando información de la habilidad...</div>
        </div>
      </div>
    )
  }

  const abilityName = t(`ability_${ability.name.replace(/\s+/g, "")}`);
  const abilityDescription = t(`ability_${ability.name.replace(/\s+/g, "")}_description`);

  return (
    <div className="bg-layer-2 min-h-full overflow-auto">
      <div className="mt-4 p-4 max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-primary-hover mr-3" />
            <h1 className="text-2xl font-bold text-ink">
              {abilityName}
            </h1>
          </div>
          <InternalLink 
            href="smartrotom/pokedex/habilidades" 
            className="text-primary-hover hover:text-primary-hover text-sm flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver a habilidades
          </InternalLink>
        </div>

        {/* Single prominent description card */}
        <div className="mb-6 bg-layer-3/40 rounded-lg p-6 border border-edge/60">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <SparklesIcon className="h-5 w-5 text-primary-hover" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink mb-2">Efecto</h2>
                <p className="text-lg leading-relaxed text-ink">
                  {abilityDescription}
                </p>
              </div>
            </div>
            
            {ability.isHidden !== undefined && (
              <div className="flex items-center mt-2 pt-4 border-t border-edge/30">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  ability.isHidden 
                    ? "bg-primary-soft/30 text-primary-hover border border-primary-active/50" 
                    : "bg-layer-3/30 text-ink border border-edge/50"
                }`}>
                  {ability.isHidden ? "Habilidad oculta" : "Habilidad estándar"}
                </span>
              </div>
            )}
          </div>
        </div>
          
        {/* Pokémon section */}
        <div className="bg-layer-3/30 rounded-lg p-6 border border-edge/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpenIcon className="h-5 w-5 text-primary-hover mr-2" />
              <h2 className="text-lg font-semibold text-ink">
                Pokémon con esta habilidad
              </h2>
            </div>
            <span className="bg-primary-soft/30 text-primary-hover px-2.5 py-0.5 rounded-full text-sm">
              {pokemon?.length || 0} Pokémon
            </span>
          </div>
            
          {pokemon && pokemon.length > 0 ? (
            <div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-2 justify-items-center">
                {displayedPokemon?.map((poke) => (
                  <div key={poke.speciesID + poke.form} className="transition-transform hover:scale-110 p-1">
                    <PokemonSpriteLink 
                      id={poke.speciesID} 
                      form={poke.form} 
                      palette="none" 
                      width={56} 
                      height={56} 
                      hide={true}
                      url={poke.spriteUrl}
                    />
                  </div>
                ))}
              </div>
                
              {hasMoreToShow && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="px-4 py-2 bg-layer-3/70 hover:bg-layer-3/70 text-ink rounded-md text-sm transition-colors"
                  >
                    {showAll ? "Mostrar menos" : `Ver todos (${pokemon.length})`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg p-8 text-center border border-edge/30">
              <p className="text-ink">No se encontraron Pokémon con esta habilidad</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}