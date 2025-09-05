import { PCBoxData, PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import PokemonSlot from './PokemonSlot'
import BoxHeader from './BoxHeader'
import { motion } from 'framer-motion'

interface DualBoxGridProps {
  primaryBoxData: PCBoxData;
  secondaryBoxData?: PCBoxData | null;
  selectedPokemon: PCPokemon | null;
  onPokemonClick: (pokemon: PCPokemon | null) => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
  totalBoxes: number;
  onPrimaryBoxChange: (boxNumber: number) => void;
  onSecondaryBoxChange?: (boxNumber: number | null) => void;
  rows: number;
  cols: number;
  battleTeams?: BattleTeam[];
  onAddToBattleTeam?: (teamId: string, position: number, pokemon: PCPokemon) => void;
}

export default function DualBoxGrid({ 
  primaryBoxData, 
  secondaryBoxData,
  selectedPokemon, 
  onPokemonClick,
  onPokemonMove,
  totalBoxes,
  onPrimaryBoxChange,
  onSecondaryBoxChange,
  rows,
  cols,
  battleTeams,
  onAddToBattleTeam
}: DualBoxGridProps) {
  
  const renderBoxGrid = (boxData: PCBoxData, isPrimary: boolean = true) => {
    const slots = []
    
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.02,
          delayChildren: isPrimary ? 0 : 0.1
        }
      }
    }

    const rowVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          staggerChildren: 0.01
        }
      }
    }
    
    for (let row = 0; row < rows; row++) {
      const rowSlots = []
      
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col
        const pokemon = boxData.pokemon[index]
        const isSelected = selectedPokemon && pokemon && 
          selectedPokemon.index === pokemon.index && 
          selectedPokemon.box === pokemon.box || false
        
        rowSlots.push(
          <PokemonSlot
            key={`${boxData.boxNumber}-${row}-${col}`}
            pokemon={pokemon}
            index={index}
            isSelected={isSelected}
            onClick={() => onPokemonClick(pokemon)}
            onPokemonMove={onPokemonMove}
            currentBox={boxData.boxNumber}
            battleTeams={battleTeams}
            onAddToBattleTeam={onAddToBattleTeam}
          />
        )
      }
      
      slots.push(
        <motion.div 
          key={row} 
          className="flex justify-center space-x-3"
          variants={rowVariants}
        >
          {rowSlots}
        </motion.div>
      )
    }
    
    return (
      <motion.div 
        className="space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {slots}
      </motion.div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  const dualBoxVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const boxVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  const secondaryBoxVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  }

  // Single box view
  if (!secondaryBoxData) {
    return (
      <motion.div 
        className="relative bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl h-full flex flex-col overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        {/* Box Header */}
        <BoxHeader
          boxData={primaryBoxData}
          totalBoxes={totalBoxes}
          isSecondary={false}
          onBoxChange={onPrimaryBoxChange}
        />

        {/* Grid Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-6">
          {renderBoxGrid(primaryBoxData)}
        </div>
      </motion.div>
    )
  }

  // Dual box view
  return (
    <motion.div 
      className="flex flex-col gap-4 h-full"
      variants={dualBoxVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Boxes Container */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Primary Box */}
        <motion.div 
          className="relative flex-1 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl flex flex-col overflow-hidden"
          variants={boxVariants}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          
          {/* Box Header */}
          <BoxHeader
            boxData={primaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={false}
            onBoxChange={onPrimaryBoxChange}
          />

          {/* Grid Container */}
          <div className="relative z-10 flex-1 flex items-center justify-center p-4 min-h-0">
            {renderBoxGrid(primaryBoxData, true)}
          </div>
        </motion.div>

        {/* Secondary Box */}
        <motion.div 
          className="relative flex-1 bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-500/30 shadow-2xl flex flex-col overflow-hidden"
          variants={secondaryBoxVariants}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
          
          {/* Box Header */}
          <BoxHeader
            boxData={secondaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={true}
            onBoxChange={(boxNumber) => onSecondaryBoxChange?.(boxNumber)}
            onDeselect={() => onSecondaryBoxChange?.(null)}
          />

          {/* Grid Container */}
          <div className="relative z-10 flex-1 flex items-center justify-center p-4 min-h-0">
            {renderBoxGrid(secondaryBoxData, false)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}