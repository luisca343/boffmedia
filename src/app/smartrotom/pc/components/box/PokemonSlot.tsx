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
  <div className="absolute top-1 left-1 z-20">
    <FaStar className="text-white text-xs" />
  </div>
))

// Separate component for gender indicator
const GenderIndicator = memo(({ gender }: { gender: any }) => {
  const icon = getGenderIcon(gender)
  if (!icon) return null
  
  return (
    <div className="absolute top-1 right-1 z-20">
      <div className="w-4 h-4 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
        {icon}
      </div>
    </div>
  )
})

// Separate component for item indicator
const ItemIndicator = memo(({ item }: { item: string }) => (
  <div className="absolute bottom-1 left-1 z-20">
    <div className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
      <PokemonItemImage itemId={item} size={20} />
    </div>
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
    transform: isDragging ? 'none' : CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
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
          className={`absolute inset-0 bg-gradient-to-br from-gray-600/20 to-gray-800/20 border-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group backdrop-blur-sm ${
            isOver 
              ? 'border-green-400 bg-green-400/20 shadow-green-400/50 shadow-lg' 
              : 'border-gray-500/30 hover:border-gray-400/50'
          }`}
          onDragOver={undefined}
          onDragLeave={undefined}
          onDrop={undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none rounded-xl" />
          <div className="text-gray-500 group-hover:text-gray-400 transition-colors relative z-10">
            <div className="w-8 h-8 border-2 border-dashed border-current rounded-full opacity-50 flex items-center justify-center">
              <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
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
        className={`absolute inset-0 bg-gradient-to-br from-surface-50/20 to-surface-100/30 border-2 rounded-xl cursor-pointer transition-all duration-200 backdrop-blur-sm overflow-hidden ${
          isOver
            ? 'border-green-400 bg-green-400/20'
            : isSelected 
            ? 'border-yellow-400 bg-yellow-400/10' 
            : 'border-white/30 hover:border-white/60 bg-slate-800/20 hover:bg-slate-800/30'
        }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        {/* Pokemon Image */}
        <div className="absolute inset-1 flex items-center justify-center z-10">
          <PokemonImage
            itemId={createPokemonSpec(pokemon.pokemon)}
            size={64}
          />
        </div>

        {/* Static indicators */}
        {isShiny && <ShinyIndicator />}
        <GenderIndicator gender={pokemon.pokemon.gender} />
        {hasItem && <ItemIndicator item={pokemon.pokemon.item} />}

        {/* Drag over indicator */}
        {isOver && (
          <div className="absolute inset-0 bg-green-400/15 border-2 border-green-400 rounded-xl pointer-events-none backdrop-blur-sm">
            <div className="absolute inset-2 border border-dashed border-green-400/60 rounded-lg opacity-75" />
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