import { PokemonW } from '@/generated/api'
import { TeamSlot } from './TeamSlot';
import { PiUsers } from 'react-icons/pi';

interface TeamPanelProps {
  teamData: (PokemonW | null)[];
  selectedPokemon: PokemonW | null;
  onPokemonClick: (pokemon: PokemonW | null) => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
}

export default function TeamPanel({ 
  teamData, 
  selectedPokemon, 
  onPokemonClick,
  onPokemonMove 
}: TeamPanelProps) {
  // Create a 6-slot team array (fill empty slots with null)
  const teamSlots = Array.from({ length: 6 }, (_, index) => teamData[index] || null)

  return (
    <div className="bg-gradient-to-br from-green-800/20 via-emerald-800/20 to-teal-800/20 backdrop-blur-sm rounded-b-2xl border border-green-400/30 border-t-0 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700/50 to-emerald-700/50 p-3 border-b border-green-400/30 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <PiUsers className="text-green-300 text-lg" />
          <div>
            <h3 className="text-lg font-bold text-white">Equipo Actual</h3>
            <p className="text-green-200 text-sm">{teamData.length}/6 Pokémon</p>
          </div>
        </div>
      </div>

      {/* Team Slots */}
      <div className="flex flex-col justify-between flex-1 p-3 space-y-2 overflow-hidden">
        {teamSlots.map((pokemon, index) => (
          <TeamSlot
            key={index}
            pokemon={pokemon}
            index={index}
            isSelected={selectedPokemon === pokemon}
            onClick={() => onPokemonClick(pokemon)}
            onPokemonMove={onPokemonMove}
          />
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 mt-auto flex-shrink-0">
        <div className="text-center text-green-200 text-xs">
          Arrastra Pokémon para reorganizar
        </div>
      </div>
    </div>
  )
}