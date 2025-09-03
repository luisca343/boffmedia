import { PCBoxData, PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import PokemonSlot from './PokemonSlot'
import BoxHeader from './BoxHeader'

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
        <div key={row} className="flex justify-center space-x-2">
          {rowSlots}
        </div>
      )
    }
    
    return slots
  }

  // Single box view
  if (!secondaryBoxData) {
    return (
      <div className="bg-gradient-to-br from-purple-800/20 via-indigo-800/20 to-blue-800/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 shadow-2xl h-full flex flex-col">
        {/* Box Header */}
        <BoxHeader
          boxData={primaryBoxData}
          totalBoxes={totalBoxes}
          isSecondary={false}
          onBoxChange={onPrimaryBoxChange}
        />

        {/* Grid Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="space-y-4">
            {renderBoxGrid(primaryBoxData)}
          </div>
        </div>
      </div>
    )
  }

  // Dual box view
  return (
    <div className="flex flex-col gap-4 h-full ">
      {/* Boxes Container */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Primary Box */}
        <div className="flex-1 bg-gradient-to-br from-purple-800/20 via-indigo-800/20 to-blue-800/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 shadow-2xl flex flex-col">
          {/* Box Header */}
          <BoxHeader
            boxData={primaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={false}
            onBoxChange={onPrimaryBoxChange}
          />

          {/* Grid Container */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <div className="space-y-3">
              {renderBoxGrid(primaryBoxData, true)}
            </div>
          </div>
        </div>

        {/* Secondary Box */}
        <div className="flex-1 bg-gradient-to-br from-green-800/20 via-emerald-800/20 to-teal-800/20 backdrop-blur-sm rounded-2xl border border-green-400/30 shadow-2xl flex flex-col">
          {/* Box Header */}
          <BoxHeader
            boxData={secondaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={true}
            onBoxChange={(boxNumber) => onSecondaryBoxChange?.(boxNumber)}
            onDeselect={() => onSecondaryBoxChange?.(null)}
          />

          {/* Grid Container */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <div className="space-y-3">
              {renderBoxGrid(secondaryBoxData, false)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
