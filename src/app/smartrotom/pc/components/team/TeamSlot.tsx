import { PokemonW } from "@/generated/api"
import { PokemonImage } from '@/lib/PokemonImage'
import { createPokemonSpecFromTeam } from "../../utils/pokemonUtils"
import { PiHeartFill, PiGenderMaleBold, PiGenderFemaleBold, PiGenderNeuterBold, PiStarFill, PiSkull, PiFire, PiLightning, PiSnowflake, PiBed, PiSkullFill } from "react-icons/pi"
import { PokemonItemImage } from "@/components/common/pokemon/PokemonItemImage"
import { getStatusColor } from "@/app/(boffmedia)/(herramientas)/mhwilds/builds/planner/_components/equipment-utils"
import { motion } from "framer-motion"
import { useState } from "react"

export function TeamSlot({ 
  pokemon, 
  index, 
  isSelected, 
  onClick, 
  onPokemonMove 
}: {
  pokemon: PokemonW | null
  index: number
  isSelected: boolean
  onClick: () => void
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void
}) {
  
  const [isHovered, setIsHovered] = useState(false)
  
  const handleDragStart = (e: React.DragEvent) => {
    if (!pokemon) return
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      pokemon,
      source: 'team',
      sourceIndex: index
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (dragData.source === 'box') {
        // Handle dropping from box to team
        onPokemonMove(
          { 
            type: 'box', 
            boxNumber: dragData.boxNumber, 
            index: dragData.sourceIndex 
          },
          { 
            type: 'team', 
            index: index 
          }
        )
      } else if (dragData.source === 'team') {
        // Handle team reordering
        onPokemonMove(
          { 
            type: 'team', 
            index: dragData.sourceIndex 
          },
          { 
            type: 'team', 
            index: index 
          }
        )
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }

  // Calculate HP percentage and max HP
  const maxHP = pokemon?.stats?.[0] || 0
  const currentHP = pokemon?.hp || 0
  const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0

  // Determine if Pokemon is fainted
  const isFainted = pokemon?.status?.toLowerCase() === 'fainted' || currentHP === 0

  // Animation variants for Pokémon bounce
  const bounceVariants = {
    idle: { y: 0 },
    bounce: {
      y: [0, -5, 0],
      transition: {
        duration: 0.25,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  }

  return (
    <div
      className={`group relative h-20 bg-indigo-700 hover:bg-indigo-600 shadow-md hover:bg-secondary-200/20 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? 'border-yellow-400 bg-yellow-400/10 shadow-yellow-400/50 shadow-lg'
          : pokemon
          ? isFainted
            ? 'border-red-400/50 bg-gradient-to-r from-red-600/30 to-red-700/30 hover:border-red-400/80 hover:shadow-lg'
            : 'border-green-400/50 bg-gradient-to-r from-green-600/30 to-emerald-600/30 hover:border-green-400/80 hover:shadow-lg'
          : 'border-gray-500/30 bg-gray-600/10 border-dashed hover:border-gray-400/50'
      }`}
      onClick={onClick}
      draggable={!!pokemon}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {pokemon ? (
        <div className="flex items-center h-full p-2">
          {/* Pokemon Image */}
          <div className={`w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 relative ${
            isFainted ? 'opacity-50 grayscale' : ''
          }`}>
            <motion.div
              variants={bounceVariants}
              animate={pokemon && !isFainted && isHovered ? 'bounce' : 'idle'}
            >
              <PokemonImage
                itemId={createPokemonSpecFromTeam(pokemon)}
                size={48}
              />
            </motion.div>
            {isFainted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-red-500 text-base font-bold">💀</div>
              </div>
            )}
          </div>

          {/* Pokemon Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center space-x-1">
                <h4 className={`font-medium text-sm truncate ${
                  isFainted ? 'text-red-300' : 'text-white'
                }`}>
                  {pokemon.name}
                </h4>
                {getGenderIcon(pokemon.gender)}
                {pokemon.palette === 'shiny' && (
                  <PiStarFill className="text-yellow-400 text-xs animate-pulse" />
                )}
              </div>
            </div>
            
            <div className={`text-xs mb-1 ${
              isFainted ? 'text-red-200' : 'text-green-200'
            }`}>
              Nv. {pokemon.level} • {pokemon.species}
              {pokemon.form && ` (${pokemon.form})`}
            </div>

            {/* HP Bar */}
            <div className="flex items-center space-x-2 mb-1">
              {getStatusIcon(pokemon.status)}
              <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getHPBarColor(hpPercentage)}`}
                  style={{ width: `${Math.max(0, Math.min(100, hpPercentage))}%` }}
                />
              </div>
              <span className="text-xs text-gray-300">
                {currentHP}/{maxHP}
              </span>
            </div>
          </div>

          {/* Item Indicator */}
          {pokemon.item && pokemon.item !== 'item.minecraft.air' && (
            <div className="absolute top-1 right-1">
                <PokemonItemImage itemId={pokemon.item} size={36} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full select-none bg-indigo-600/40 border border-indigo-400/40 rounded-xl">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded-full mx-auto mb-1 opacity-50"></div>
            <span className="text-gray-400 text-xs">Slot {index + 1}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'poison':
      return <PiSkullFill className={`text-xs text-purple-400`} />
    case 'burned':
      return <PiFire className={`text-xs text-red-400`} />
    case 'paralyzed':
      return <PiLightning className={`text-xs text-yellow-400`} />
    case 'frozen':
      return <PiSnowflake className={`text-xs text-blue-400`} />
    case 'sleeping':
      return <PiBed className={`text-xs text-gray-400`} />
    case 'fainted':
      return <PiSkull className={`text-xs text-red-600`} />
    case 'healthy':
    default:
      return <PiHeartFill className={`text-xs text-green-400`} />
  }
}

function getGenderIcon(gender?: string) {
  switch (gender?.toLowerCase()) {
    case 'male':
      return <PiGenderMaleBold className="text-blue-400 text-xs" />
    case 'female':
      return <PiGenderFemaleBold className="text-pink-400 text-xs" />
    case 'genderless':
      return <PiGenderNeuterBold className="text-gray-400 text-xs" />
    default:
      return null
  }
}

function getHPBarColor(hpPercentage: number): string {
  if (hpPercentage > 50) return 'bg-green-500'
  if (hpPercentage > 20) return 'bg-yellow-500'
  return 'bg-red-500'
}