import { useState, memo, useMemo } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonImage } from '@/lib/PokemonImage'
import { FaTrophy, FaPlus, FaStar } from 'react-icons/fa'
import { PiGenderMale, PiGenderFemale, PiTarget } from 'react-icons/pi'
import { createPokemonSpec } from '../../utils/pokemonUtils'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import { useBattleTeamContextMenu } from '../../hooks/useContextMenu'
import { PokemonItemImage } from '@/components/common/pokemon/PokemonItemImage'
import { getGenderIcon, isPokemonShiny } from '@/lib/smartrotom/pokemonDisplayUtils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PokemonSlotProps {
  id: string;
  pokemon: PCPokemon | null;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  currentBox: number;
  battleTeams?: BattleTeam[];
  onAddToBattleTeam?: (teamId: string, position: number, pokemon: PCPokemon) => void;
}

// Separate component for shiny indicator
const ShinyIndicator = memo(() => (
  <div className="absolute top-0 left-0 w-4 h-4 bg-black border border-gray-600 flex items-center justify-center z-20">
    <FaStar className="text-white text-xs" />
  </div>
))

// Separate component for gender indicator
const GenderIndicator = memo(({ gender }: { gender: any }) => {
  const icon = getGenderIcon(gender)
  if (!icon) return null
  
  return (
    <div className="absolute top-0 right-0 w-4 h-4 bg-white border border-black flex items-center justify-center z-20">
      <div className="text-black text-xs">{icon}</div>
    </div>
  )
})

// Separate component for item indicator
const ItemIndicator = memo(({ item }: { item: string }) => (
  <div className="absolute bottom-0 left-0 w-6 h-6 bg-white border border-black flex items-center justify-center z-20">
    <div className="w-3 h-3 bg-black" />
  </div>
))

// Main component with Gen 1 style
const PokemonSlot = memo(function PokemonSlot({ 
  id,
  pokemon, 
  index, 
  isSelected, 
  onClick, 
  currentBox,
  battleTeams,
  onAddToBattleTeam 
}: PokemonSlotProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Memoize expensive calculations
  const isShiny = useMemo(() => isPokemonShiny(pokemon?.pokemon), [pokemon?.pokemon])
  const hasItem = useMemo(() => 
    pokemon?.pokemon.item && pokemon.pokemon.item !== 'item.minecraft.air', 
    [pokemon?.pokemon.item]
  )

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
      type: 'box',
      boxNumber: currentBox,
      index,
      pokemon
    },
    disabled: !pokemon // Only allow dragging if there's a pokemon
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Handle battle team context menu
  const { 
    isVisible: isContextMenuVisible, 
    position: contextMenuPosition, 
    showContextMenu: openContextMenu, 
    handleAddToBattleTeam: addToBattleTeam 
  } = useBattleTeamContextMenu(
    (teamId: string, position: number) => {
      if (pokemon && onAddToBattleTeam) {
        onAddToBattleTeam(teamId, position, pokemon)
      }
    }
  )

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!pokemon || !battleTeams || !onAddToBattleTeam) return
    openContextMenu(e)
  }

  // Empty slot with Gen 1 retro style
  if (!pokemon) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="relative w-20 h-20 sm:w-24 sm:h-24"
        {...attributes}
        {...listeners}
      >
        <div 
          className={`absolute inset-0 bg-gray-200 border-4 cursor-pointer transition-all duration-150 ${
            isOver 
              ? 'border-black bg-gray-300' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-black group-hover:text-gray-700 transition-colors">
              <div className="w-8 h-8 border-2 border-dashed border-current flex items-center justify-center">
                <div className="w-2 h-2 bg-current opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filled slot with Gen 1 retro style
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="relative w-20 h-20 sm:w-24 sm:h-24"
      {...attributes}
      {...listeners}
    >
      <div 
        className={`absolute inset-0 bg-white border-4 cursor-pointer transition-all duration-150 overflow-hidden ${
          isOver
            ? 'border-black bg-gray-300'
            : isSelected 
            ? 'border-black bg-gray-200' 
            : 'border-gray-600 hover:border-gray-500 hover:bg-gray-100'
        } ${isHovered ? 'scale-105' : 'scale-100'} ${
          isDragging ? 'opacity-50' : 'opacity-100'
        }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Pokemon Image */}
        <div className="absolute inset-1 flex items-center justify-center z-10">
          <PokemonImage
            itemId={createPokemonSpec(pokemon.pokemon)}
            size={isHovered ? 70 : 64}
          />
        </div>

        {/* Static indicators */}
        {isShiny && <ShinyIndicator />}
        <GenderIndicator gender={pokemon.pokemon.gender} />
        {hasItem && <ItemIndicator item={pokemon.pokemon.item} />}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-4 border-black pointer-events-none">
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-black" />
          </div>
        )}

        {/* Drag over indicator */}
        {isOver && (
          <div className="absolute inset-0 bg-gray-500/30 border-4 border-black pointer-events-none">
            <div className="absolute inset-2 border-2 border-dashed border-black" />
          </div>
        )}
      </div>
    </div>
  )
})

export default PokemonSlot

/* Add these CSS classes to your global CSS file for the retro background */
/*
.bg-blue-850 {
  background-color: rgb(30 58 138 / 0.8);
}
*/