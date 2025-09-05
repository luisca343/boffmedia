import { useState, memo, useMemo } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonImage } from '@/lib/PokemonImage'
import { FaTrophy, FaPlus, FaStar } from 'react-icons/fa'
import { createPokemonSpec } from '../../utils/pokemonUtils'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import { useBoxSlotDragDrop } from '../../hooks/useDragDrop'
import { useBattleTeamContextMenu } from '../../hooks/useContextMenu'
import { DragSource, DragDestination } from '../../types/dragDrop'
import { PokemonItemImage } from '@/components/common/pokemon/PokemonItemImage'
import { motion, AnimatePresence } from 'framer-motion'
import { getGenderIcon, isPokemonShiny } from '@/lib/smartrotom/pokemonDisplayUtils'
import { OPTIMIZED_ANIMATIONS, PERFORMANCE_CONFIGS } from '@/lib/smartrotom/optimizedAnimations'

interface PokemonSlotProps {
  pokemon: PCPokemon | null;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
  currentBox: number;
  battleTeams?: BattleTeam[];
  onAddToBattleTeam?: (teamId: string, position: number, pokemon: PCPokemon) => void;
}

// Memoized static variants to prevent recreation
const slotVariants = {
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.15, ease: "easeOut" }
  }
}

const pokemonImageVariants = {
  hover: { 
    scale: 1.1,
    transition: { duration: 0.15 }
  }
}

// Separate component for shiny indicator to isolate animation
const ShinyIndicator = memo(() => (
  <motion.div 
    className="absolute top-1 left-1 z-20"
    initial={{ scale: 0 }}
    animate={PERFORMANCE_CONFIGS.shinySimple}
    transition={{ duration: 0.2 }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear"
      }}
      className="w-4 h-4 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
    >
      <FaStar className="text-white text-xs" />
    </motion.div>
  </motion.div>
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

// Main component with reduced animations
const PokemonSlot = memo(function PokemonSlot({ 
  pokemon, 
  index, 
  isSelected, 
  onClick, 
  onPokemonMove, 
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

  const { isDragOver, handleDragStart, handleDragOver, handleDragLeave, handleDrop } = useBoxSlotDragDrop(
    currentBox,
    index,
    (source: DragSource, destination: DragDestination) => {
      onPokemonMove(source, destination)
    }
  )

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

  const handleSlotDragStart = (e: React.DragEvent) => {
    if (!pokemon) return
    handleDragStart(e, pokemon)
  }

  // Empty slot with minimal animation
  if (!pokemon) {
    return (
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gray-600/20 to-gray-800/20 border-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group backdrop-blur-sm ${
            isDragOver 
              ? 'border-green-400 bg-green-400/20 shadow-green-400/50 shadow-lg' 
              : 'border-gray-500/30 hover:border-gray-400/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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

  // Filled slot with optimized animations
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br from-surface-50/20 to-surface-100/30 border-2 rounded-xl cursor-pointer transition-all duration-200 backdrop-blur-sm overflow-hidden ${
          isDragOver
            ? 'border-green-400 bg-green-400/20'
            : isSelected 
            ? 'border-yellow-400 bg-yellow-400/10' 
            : 'border-white/30 hover:border-white/60 bg-slate-800/20 hover:bg-slate-800/30'
        }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        draggable={true}
        onDragStart={(e) => {
          const dragEvent = e as unknown as React.DragEvent;
          handleSlotDragStart(dragEvent);
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        variants={OPTIMIZED_ANIMATIONS.slotContainer}
        whileHover="hover"
        // Remove complex boxShadow animations - use CSS instead
        style={{
          boxShadow: isDragOver
            ? "0 0 0 2px rgba(34, 197, 94, 0.6), 0 8px 20px rgba(34, 197, 94, 0.2)"
            : isSelected
            ? "0 0 0 2px rgba(250, 204, 21, 0.6), 0 8px 20px rgba(250, 204, 21, 0.3)"
            : undefined
        }}
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
        
        {/* Pokemon Image with reduced animation */}
        <div className="absolute inset-1 flex items-center justify-center z-10">
          <motion.div
            variants={pokemonImageVariants}
            animate={isHovered ? "hover" : "idle"}
          >
            <PokemonImage
              itemId={createPokemonSpec(pokemon.pokemon)}
              size={64}
            />
          </motion.div>
        </div>

        {/* Static indicators - only animate on mount/unmount */}
        {isShiny && <ShinyIndicator />}
        <GenderIndicator gender={pokemon.pokemon.gender} />
        {hasItem && <ItemIndicator item={pokemon.pokemon.item} />}

        {isDragOver && (
          <div className="absolute inset-0 bg-green-400/15 border-2 border-green-400 rounded-xl pointer-events-none backdrop-blur-sm">
            <div className="absolute inset-2 border border-dashed border-green-400/60 rounded-lg opacity-75" />
          </div>
        )}
      </motion.div>
    </div>
  )
})

export default PokemonSlot