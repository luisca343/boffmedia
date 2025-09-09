import { PCBoxData, PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import PokemonSlot from './PokemonSlot'
import BoxHeader from './BoxHeader'
import { SortableContext } from '@dnd-kit/sortable'
import { stablePositionStrategy } from '@/lib/drag-and-drop'

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
  onShowBoxSelection?: () => void;

  onShowSecondaryBoxSelection?: () => void;
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
  onAddToBattleTeam,
  onShowBoxSelection,
  onShowSecondaryBoxSelection
}: DualBoxGridProps) {
  
  const renderBoxGrid = (boxData: PCBoxData) => {
    const slots = []
    const slotIds = []
    
    for (let row = 0; row < rows; row++) {
      const rowSlots = []
      
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col
        const pokemon = boxData.pokemon[index]
        const slotId = `box-${boxData.boxNumber}-slot-${index}`
        slotIds.push(slotId)
        
        const isSelected = selectedPokemon && pokemon && 
          selectedPokemon.index === pokemon.index && 
          selectedPokemon.box === pokemon.box || false
        
        rowSlots.push(
          <PokemonSlot
            key={slotId}
            id={slotId}
            pokemon={pokemon}
            index={index}
            isSelected={isSelected}
            onClick={() => onPokemonClick(pokemon)}
            currentBox={boxData.boxNumber}
            battleTeams={battleTeams}
            onAddToBattleTeam={onAddToBattleTeam}
          />
        )
      }
      
      slots.push(
        <div 
          key={row} 
          className="flex justify-center space-x-2"
          style={{
            animationDelay: `${row * 0.05}s`
          }}
        >
          {rowSlots}
        </div>
      )
    }
    
    return (
      <SortableContext items={slotIds} strategy={stablePositionStrategy}>
        <div className="space-y-2 animate-fade-in">
          {slots}
        </div>
      </SortableContext>
    )
  }

  // Single box view
  if (!secondaryBoxData) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Box Header */}
        <BoxHeader
          boxData={primaryBoxData}
          totalBoxes={totalBoxes}
          isSecondary={false}
          onBoxChange={onPrimaryBoxChange}
          onShowBoxSelection={onShowBoxSelection}
        />

        {/* Grid Container */}
        <div className="bg-slate-900/40 flex-1 flex items-center justify-center p-3 min-h-0">
          {renderBoxGrid(primaryBoxData)}
        </div>
      </div>
    )
  }

  // Dual box view
  return (
    <div className="flex flex-col gap-3 h-full  animate-fade-in">
      {/* Boxes Container */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Primary Box */}
        <div className="flex-1  flex flex-col overflow-hidden animate-slide-in-left">
          {/* Box Header */}
          <BoxHeader
            boxData={primaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={false}
            onBoxChange={onPrimaryBoxChange}
            onShowBoxSelection={onShowBoxSelection}
          />

          {/* Grid Container */}
          <div className="bg-slate-900/40 flex-1 flex items-center justify-center p-3 min-h-0">
            {renderBoxGrid(primaryBoxData)}
          </div>
        </div>

        {/* Secondary Box */}
        <div className="flex-1 flex flex-col overflow-hidden animate-slide-in-right">
          {/* Box Header */}
          <BoxHeader
            boxData={secondaryBoxData}
            totalBoxes={totalBoxes}
            isSecondary={true}
            onBoxChange={(boxNumber) => onSecondaryBoxChange?.(boxNumber)}
            onDeselect={() => onSecondaryBoxChange?.(null)}
            onShowBoxSelection={onShowSecondaryBoxSelection}
          />

          {/* Grid Container */}
          <div className="bg-slate-900/40  flex-1 flex items-center justify-center p-3 min-h-0">
            {renderBoxGrid(secondaryBoxData)}
          </div>
        </div>
      </div>
    </div>
  )
}
