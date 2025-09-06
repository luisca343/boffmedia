import { PokemonW } from "@/generated/api"
import { PokemonImage } from '@/lib/PokemonImage'
import { createPokemonSpecFromTeam } from "../../utils/pokemonUtils"
import { PiStarFill, PiSkullFill } from "react-icons/pi"
import { PokemonItemImage } from "@/components/common/pokemon/PokemonItemImage"
import { useState, useMemo, useCallback } from "react"
import { calculatePokemonHP, getGenderIcon } from "@/lib/smartrotom/pokemonDisplayUtils"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function TeamSlot({ 
  id,
  pokemon, 
  index, 
  isSelected, 
  onClick
}: {
  id: string
  pokemon: PokemonW | null
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  
  const [isHovered, setIsHovered] = useState(false)

  // Memoize expensive calculations
  const pokemonData = useMemo(() => {
    if (!pokemon) return null
    return calculatePokemonHP(pokemon)
  }, [pokemon?.hp, pokemon?.stats])
  
  // Setup dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver
  } = useSortable({
    id,
    data: {
      type: 'team',
      index,
      pokemon
    },
    disabled: !pokemon // Only allow dragging if there's a pokemon
  })

  const style = {
    transform: isDragging ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  }

  const { currentHP, maxHP, hpPercentage, isFainted } = pokemonData || { 
    currentHP: 0, maxHP: 0, hpPercentage: 0, isFainted: false 
  }

  // Get HP bar color (Gen 1 black and white style)
  const getHPColor = (percentage: number) => {
    // In Gen 1 GB, HP was just black bars on white background
    return 'bg-black'
  }

  // Get status color (Gen 1 black and white style)
  const getStatusColor = (status: string) => {
    // In Gen 1 GB, all status conditions were just black text on white
    return 'text-black bg-white border-black'
  }

  const slotClasses = `
    relative border-2 p-2 cursor-pointer transition-all duration-150 
    ${isSelected ? 'border-black bg-gray-300' : 'border-gray-600 hover:border-gray-500'} 
    ${pokemon ? (isFainted ? 'bg-gray-800 border-gray-700' : 'bg-white hover:bg-gray-100') : 'bg-gray-200 border-dashed border-gray-500'} 
    ${isOver ? 'border-black bg-gray-300' : ''} 
    ${isHovered ? 'scale-[1.01]' : 'scale-100'}
    ${isDragging ? 'opacity-50' : 'opacity-100'}
    active:scale-[0.99]
  `

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={slotClasses}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={pokemon ? `${pokemon.name}, Level ${pokemon.level}, ${Math.round(hpPercentage)}% HP, Status: ${pokemon.status}` : `Empty party slot ${index + 1}`}
      tabIndex={0}
    >
      {pokemon ? (
        <div className="flex items-center h-full relative">
          {/* Pokemon Image */}
          <div className="relative flex-shrink-0">
            <div className={`w-12 h-12 bg-white border-2 border-black flex items-center justify-center mr-3 relative ${
              isFainted ? 'opacity-50 grayscale' : ''
            }`}>
              <PokemonImage
                itemId={createPokemonSpecFromTeam(pokemon)}
                size={40}
              />
              
              {/* Fainted overlay */}
              {isFainted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <PiSkullFill className="text-white text-lg" />
                </div>
              )}
              
              {/* Shiny indicator - Gen 1 style */}
              {pokemon.palette === 'shiny' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-black border border-gray-600 flex items-center justify-center">
                  <PiStarFill className="text-white text-xs" />
                </div>
              )}
            </div>
            
            {/* Item Indicator - Gen 1 style */}
            {pokemon.item && pokemon.item !== 'item.minecraft.air' && (
              <div className="absolute top-0 left-0">
                <div className="w-5 h-5 bg-black border border-gray-600 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white" />
                </div>
              </div>
            )}
          </div>

          {/* Pokemon Info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Name and Level Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 min-w-0">
                <h4 className={`font-mono font-bold text-sm truncate ${
                  isFainted ? 'text-gray-600' : 'text-black'
                }`}>
                  {pokemon.name}
                </h4>
                {getGenderIcon(pokemon.gender) && (
                  <div className="text-black">
                    {getGenderIcon(pokemon.gender)}
                  </div>
                )}
              </div>
              <div className={`font-mono text-xs px-1 border ${
                isFainted ? 'text-gray-600 border-gray-500 bg-gray-300' : 'text-black border-black bg-white'
              }`}>
                L{pokemon.level}
              </div>
            </div>
            
            {/* Species and Form */}
            <div className={`font-mono text-xs truncate ${
              isFainted ? 'text-gray-600' : 'text-gray-700'
            }`}>
              {pokemon.species}
              {pokemon.form && ` (${pokemon.form})`}
            </div>

            {/* HP and Status Bar */}
            <div className="flex items-center space-x-2">
              {/* HP Bar - Gen 1 style */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-black">HP</span>
                  <span className="font-mono text-[10px] text-black">
                    {currentHP}/{maxHP}
                  </span>
                </div>
                <div className="h-1 bg-white border border-black">
                  <div
                    className={`h-full transition-all duration-300 ${getHPColor(hpPercentage)}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, hpPercentage))}%`
                    }}
                  />
                </div>
              </div>

              {/* Status indicator - Gen 1 style */}
              {pokemon.status !== 'none' && (
                <div className={`px-1 py-0.5 border font-mono text-[8px] ${getStatusColor(pokemon.status)}`}>
                  {pokemon.status.toUpperCase().slice(0, 3)}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full select-none">
          <div className="text-center">
            <div className={`w-8 h-8 border-2 border-dashed border-gray-600 mx-auto mb-1 flex items-center justify-center transition-all duration-150 ${
              isHovered ? 'border-black scale-105' : 'border-gray-600 scale-100'
            }`}>
              <span className="text-black font-mono text-lg">+</span>
            </div>
            <span className="text-black font-mono text-xs">SLOT {index + 1}</span>
          </div>
        </div>
      )}
      
      {/* Selection indicator - Gen 1 style */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-black pointer-events-none">
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-black" />
        </div>
      )}
      
      {/* Drag over indicator - Gen 1 style */}
      {isOver && (
        <div className="absolute inset-0 bg-gray-400/50 border-2 border-black pointer-events-none" />
      )}
    </div>
  )
}