import { PokemonW } from "@/generated/api"
import { PokemonImage } from '@/lib/PokemonImage'
import { createPokemonSpecFromTeam } from "../../utils/pokemonUtils"
import { PiStarFill, PiSkullFill } from "react-icons/pi"
import { PokemonItemImage } from "@/components/common/pokemon/PokemonItemImage"
import { useState, useMemo } from "react"
import { calculatePokemonHP, getGenderIcon, getHPBarColor, getStatusColor, getStatusIcon } from "@/lib/smartrotom/pokemonDisplayUtils"
import { BACKGROUND_PATTERNS, getHPBarContainerClasses, getLevelClasses, getPokemonSlotClasses, getPokemonTextClasses, getStatusIndicatorClasses } from "@/lib/smartrotom/pokemonStyles"
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from "framer-motion"

// Optimized animation variants from old.tsx
const OPTIMIZED_SLOT_VARIANTS = {
  idle: { 
    scale: 1,
    transition: { duration: 0.1 }
  },
  hover: { 
    scale: 1.01,
    transition: { duration: 0.1, ease: "easeOut" }
  },
  selected: {
    scale: 1.01,
    transition: { duration: 0.1 }
  },
  dragOver: {
    scale: 1.02,
    transition: { duration: 0.1 }
  }
}

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

  // Determine animation state efficiently (from old.tsx)
  const animationState = useMemo(() => {
    if (isOver) return 'dragOver'
    if (isSelected) return 'selected'
    if (isHovered) return 'hover'
    return 'idle'
  }, [isOver, isSelected, isHovered])

  const { currentHP, maxHP, hpPercentage, isFainted } = pokemonData || { 
    currentHP: 0, maxHP: 0, hpPercentage: 0, isFainted: false 
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`${getPokemonSlotClasses(isSelected, pokemon, isFainted, isOver)} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      variants={OPTIMIZED_SLOT_VARIANTS}
      animate={animationState}
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
      {/* Subtle background pattern from old.tsx */}
      <div className={BACKGROUND_PATTERNS.subtle} />
      
      {pokemon ? (
        <div className="flex items-center h-full p-2 relative z-10">
          {/* Pokemon Image */}
          <div className="relative flex-shrink-0">
            <div 
              className={`w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center mr-3 relative overflow-hidden ${
                isFainted ? 'opacity-70' : ''
              }`}
            >
              {/* Simplified Pokemon Image - removed infinite bounce animation */}
              <div
                style={{
                  transform: isFainted ? 'scale(0.9)' : 'scale(1)',
                  opacity: isFainted ? 0.5 : 1,
                  filter: isFainted ? 'grayscale(1)' : 'none',
                  transition: 'all 0.2s ease-out'
                }}
              >
                <PokemonImage
                  itemId={createPokemonSpecFromTeam(pokemon)}
                  size={48}
                />
              </div>
              {/* Fainted overlay */}
              {isFainted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                  <PiSkullFill className="text-red-400 text-lg" />
                </div>
              )}
              {/* Simplified Shiny indicator - no infinite rotation */}
              {pokemon.palette === 'shiny' && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <PiStarFill className="text-white text-xs" />
                </motion.div>
              )}
            </div>
            
            {/* Item Indicator - simplified without hover animation */}
            {pokemon.item && pokemon.item !== 'item.minecraft.air' && (
              <div 
                className="absolute top-0 left-0 p-0.5"
                title={`Held item: ${pokemon.item}`}
              >
                <PokemonItemImage itemId={pokemon.item} size={24} />
              </div>
            )}
          </div>

          {/* Pokemon Info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Name and Level Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 min-w-0">
                <h4 className={`font-semibold text-sm truncate ${getPokemonTextClasses(isFainted, 'primary')}`}>
                  {pokemon.name}
                </h4>
                {/* Gender indicator moved here */}
                {getGenderIcon(pokemon.gender)}
              </div>
              <div className={getLevelClasses(isFainted)}>
                Lv. {pokemon.level}
              </div>
            </div>
            
            {/* Species and Form */}
            <div className={`text-xs truncate ${getPokemonTextClasses(isFainted, 'secondary')}`}>
              {pokemon.species}
              {pokemon.form && ` (${pokemon.form})`}
            </div>

            {/* HP and Status Bar */}
            <div className="flex items-center space-x-2">
              
              {/* HP Bar with animation */}
              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-medium">HP</span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    {currentHP}/{maxHP}
                  </span>
                </div>
                <div className={getHPBarContainerClasses()}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getHPBarColor(hpPercentage)}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, hpPercentage))}%`
                    }}
                  />
                </div>
              </div>

              {/* Status indicator with enhanced design */}
              {pokemon.status !== 'none' && (
                <div className={getStatusIndicatorClasses(pokemon.status)}>
                  {getStatusIcon(pokemon.status)}
                  <span className={`text-[10px] font-medium ${getStatusColor(pokemon.status).replace('border-', 'text-')}`}>
                    {pokemon.status.charAt(0).toUpperCase() + pokemon.status.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full select-none">
          <div className="text-center">
            <div 
              className="w-8 h-8 border-2 border-dashed border-slate-500/50 rounded-full mx-auto mb-1 flex items-center justify-center"
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                borderColor: isHovered ? 'rgba(148, 163, 184, 0.7)' : 'rgba(148, 163, 184, 0.5)',
                transition: 'all 0.1s ease-out'
              }}
            >
              <span className="text-slate-500 text-lg font-light">+</span>
            </div>
            <span className="text-slate-500 text-xs font-medium">Slot {index + 1}</span>
          </div>
        </div>
      )}
      
      {/* Simplified Selection indicator */}
      {isSelected && (
        <div
          className="absolute inset-0 border-2 border-blue-400 rounded-2xl pointer-events-none"
          style={{
            opacity: 1,
            transform: 'scale(1)',
            transition: 'opacity 0.1s ease-out'
          }}
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
        </div>
      )}
      
      {/* Simplified Drag over indicator */}
      {isOver && (
        <div
          className="absolute inset-0 bg-green-400/10 border-2 border-green-400 rounded-2xl pointer-events-none backdrop-blur-sm"
          style={{
            opacity: 1,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      )}
    </motion.div>
  )
}