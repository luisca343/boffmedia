"use client"
import { useState } from "react"
import MoveDataElement from "../_components/MoveData"
import { PokemonSpriteLink } from "../../_components/PokemonSprite"
import { useGetPokemonByMove } from "@/hooks/pokemon/useGetPokemonByMove"
import { useGetMove } from "@/hooks/pokemon/useGetMove"
import { ArrowLeftIcon, BookOpenIcon } from "@heroicons/react/24/outline"
import { InternalLink } from "@/components/ui/navigation/Link"
import { useTranslations } from "next-intl"

export default function Movimiento({params} : {params: {id: string}}){
  const { id } = params
  const { pokemon } = useGetPokemonByMove(id)
  const { move } = useGetMove(id)
  const t = useTranslations("pokedex")
  const [showAll, setShowAll] = useState(false)
  
  const displayLimit = 50
  const displayedPokemon = showAll ? pokemon : pokemon?.slice(0, displayLimit)
  const hasMoreToShow = pokemon && pokemon.length > displayLimit

  if(!move) {
    return (
      <div className="bg-layer-2 min-h-full overflow-auto flex justify-center items-center p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
          <div className="text-ink text-xl">Cargando información del movimiento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-layer-2 min-h-full overflow-auto">
      <div className="mt-4 p-4 max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <BookOpenIcon className="h-6 w-6 text-primary-hover mr-2" />
            <h1 className="text-2xl font-bold text-ink">
              {t(`attack_${move.attackName.toLowerCase().replaceAll(" ", "_")}`)}
            </h1>
          </div>
          <InternalLink 
            href="smartrotom/pokedex/movimientos" 
            className="text-primary-hover hover:text-primary-hover text-sm flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver a movimientos
          </InternalLink>
        </div>

        {/* Two column layout for move data and Pokémon list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Move data column */}
          <div className="lg:col-span-5 bg-layer-3/30 rounded-lg p-4 border border-edge/50 h-fit">
            <MoveDataElement id={id} isFullPage={true} />
          </div>
          
          {/* Pokémon column */}
          <div className="lg:col-span-7 bg-layer-3/30 rounded-lg p-4 border border-edge/50">
            <div className="flex items-center mb-4">
              <BookOpenIcon className="h-5 w-5 text-primary-hover mr-2" />
              <h2 className="text-lg font-semibold text-ink">
                Pokémon que aprenden este movimiento
                <span className="ml-2 text-primary-hover">({pokemon?.length || 0})</span>
              </h2>
            </div>
            
            {pokemon && pokemon.length > 0 ? (
              <div className="bg-layer-3/20 rounded-lg p-3 border border-edge/30">
              <div className="flex flex-wrap gap-2 justify-center">
                {displayedPokemon?.map((poke) => {
                  return <div key={poke.speciesID + poke.form} className="transition-transform hover:scale-110">
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
            })}
              </div>
                
                {hasMoreToShow && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="px-4 py-2 bg-layer-3 hover:bg-layer-3 text-ink rounded-md text-sm transition-colors"
                    >
                      {showAll ? "Mostrar menos" : `Ver todos (${pokemon.length})`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-layer-3/20 rounded-lg p-6 text-center border border-edge/30">
                <p className="text-ink">No se encontraron Pokémon que puedan aprender este movimiento</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}