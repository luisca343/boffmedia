import { PCPokemon, PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import PokemonSlot from './PokemonSlot'

interface PokemonGridProps {
  boxData: PCBoxData;
  selectedPokemon: PCPokemon | null;
  onPokemonClick: (pokemon: PCPokemon | null) => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
  currentBox: number;
  rows: number;
  cols: number;
  battleTeams?: BattleTeam[];
  onAddToBattleTeam?: (teamId: string, position: number, pokemon: PCPokemon) => void;
}

export default function PokemonGrid({ 
  boxData, 
  selectedPokemon, 
  onPokemonClick,
  onPokemonMove,
  currentBox,
  rows,
  cols,
  battleTeams,
  onAddToBattleTeam
}: PokemonGridProps) {
  const renderGrid = () => {
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
            key={`${row}-${col}`}
            pokemon={pokemon}
            index={index}
            isSelected={isSelected}
            onClick={() => onPokemonClick(pokemon)}
            onPokemonMove={onPokemonMove}
            currentBox={currentBox}
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

  return (
    <div className="bg-gradient-to-br from-purple-800/20 via-indigo-800/20 to-blue-800/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 shadow-2xl p-6 h-full flex flex-col">
      {/* Grid Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-4">
          {renderGrid()}
        </div>
      </div>
      
      <div className="mt-4 text-center flex-shrink-0">
        <p className="text-purple-300 text-sm">
          Haz clic en un Pokémon para ver sus detalles
        </p>
      </div>
    </div>
  )
}
