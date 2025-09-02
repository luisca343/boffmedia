import { PokemonW } from '@/generated/api'
import { PokemonImage } from '@/lib/PokemonImage'
import { FaStar, FaUsers } from 'react-icons/fa'
import { createPokemonSpecFromTeam } from '../utils/pokemonUtils'

interface TeamPanelProps {
  teamData: PokemonW[];
  selectedPokemon: PokemonW | null;
  onPokemonClick: (pokemon: PokemonW | null) => void;
  onPokemonMove: (
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => void;
}

// Team slot component with drag and drop functionality
function TeamSlot({ 
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

  return (
    <div
      className={`relative h-16 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-yellow-400 bg-yellow-400/10 shadow-yellow-400/50 shadow-lg'
          : pokemon
          ? 'border-green-400/50 bg-gradient-to-r from-green-600/30 to-emerald-600/30 hover:border-green-400/80 hover:shadow-lg'
          : 'border-gray-500/30 bg-gray-600/10 border-dashed hover:border-gray-400/50'
      }`}
      onClick={onClick}
      draggable={!!pokemon}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {pokemon ? (
        <div className="flex items-center h-full p-2">
          {/* Pokemon Image */}
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
            <PokemonImage
              itemId={createPokemonSpecFromTeam(pokemon)}
              size={32}
            />
          </div>

          {/* Pokemon Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium text-sm truncate">
                {pokemon.name}
              </h4>
              <div className="flex items-center space-x-1">
                {pokemon.palette === 'shiny' && (
                  <FaStar className="text-yellow-400 text-xs animate-pulse" />
                )}
              </div>
            </div>
            <div className="text-green-200 text-xs">
              Nv. {pokemon.level} • {pokemon.species}
            </div>
          </div>

          {/* Slot Number */}
          <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-bold">
            {index + 1}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-dashed border-gray-400 rounded-full mx-auto mb-1 opacity-50"></div>
            <span className="text-gray-400 text-xs">Slot {index + 1}</span>
          </div>
        </div>
      )}
    </div>
  )
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
    <div className="bg-gradient-to-br from-green-800/20 via-emerald-800/20 to-teal-800/20 backdrop-blur-sm rounded-b-2xl rounded-tr-2xl border border-green-400/30 border-t-0 shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700/50 to-emerald-700/50 p-3 border-b border-green-400/30 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <FaUsers className="text-green-300 text-lg" />
          <div>
            <h3 className="text-lg font-bold text-white">Equipo Actual</h3>
            <p className="text-green-200 text-sm">{teamData.length}/6 Pokémon</p>
          </div>
        </div>
      </div>

      {/* Team Slots */}
      <div className="flex-1 p-3 space-y-2 overflow-hidden">
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
