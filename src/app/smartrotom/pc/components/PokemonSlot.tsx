import { useState } from 'react'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonImage } from '@/lib/PokemonImage'
import { FaStar, FaMars, FaVenus, FaTrophy, FaPlus } from 'react-icons/fa'
import { createPokemonSpec } from '../utils/pokemonUtils'
import { BattleTeam } from '@/types/dto/battle-team.dto'
import { useBoxSlotDragDrop } from '../hooks/useDragDrop'
import { useBattleTeamContextMenu } from '../hooks/useContextMenu'
import { DragSource, DragDestination } from '../types/dragDrop'

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

export default function PokemonSlot({ 
  pokemon, 
  index, 
  isSelected, 
  onClick, 
  onPokemonMove, 
  currentBox,
  battleTeams,
  onAddToBattleTeam 
}: PokemonSlotProps) {
  // Handle drag and drop with the custom hook
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

  const getGenderIcon = (gender?: string) => {
    if (!gender) return null
    switch (gender.toLowerCase()) {
      case 'male':
        return <FaMars className="text-blue-400 text-xs" />
      case 'female':
        return <FaVenus className="text-pink-400 text-xs" />
      default:
        return null
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!pokemon || !battleTeams || !onAddToBattleTeam) return
    openContextMenu(e)
  }

  const handleSlotDragStart = (e: React.DragEvent) => {
    if (!pokemon) return
    handleDragStart(e, pokemon)
  }

  if (!pokemon) {
    return (
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-gray-600/20 to-gray-800/20 border-2 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer group ${
            isDragOver 
              ? 'border-green-400 bg-green-400/20 scale-105' 
              : 'border-gray-500/30 hover:border-gray-400/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-gray-500 group-hover:text-gray-400 transition-colors">
            <div className="w-8 h-8 border-2 border-dashed border-current rounded-full opacity-50"></div>
          </div>
          <div className="absolute bottom-1 right-1 bg-gray-700/80 text-gray-300 text-xs px-1.5 py-0.5 rounded">
            {index + 1}
          </div>
        </div>
      </div>
    )
  }

  const isShiny = pokemon.pokemon.palette === 'shiny'

  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24">
      <div 
        className={`absolute inset-0 bg-surface-50/20 order-2 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
          isDragOver
            ? 'border-green-400 bg-green-400/20 scale-105 shadow-green-400/50 shadow-lg'
            : isSelected 
            ? 'border-yellow-400 shadow-yellow-400/50 shadow-lg scale-105' 
            : 'border-white/30 hover:border-white/60'
        }`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        draggable={true}
        onDragStart={handleSlotDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Pokemon Image */}
        <div className="absolute inset-1 flex items-center justify-center">
          <PokemonImage
            itemId={createPokemonSpec(pokemon.pokemon)}
            size={48}
          />
        </div>

        {/* Shiny indicator */}
        {isShiny && (
          <div className="absolute top-1 left-1">
            <FaStar className="text-yellow-400 text-xs animate-pulse" />
          </div>
        )}

        {/* Gender indicator */}
        <div className="absolute top-1 right-1">
          {getGenderIcon(pokemon.pokemon.gender)}
        </div>

        {/* Level */}
        <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-bold">
          {pokemon.pokemon.level}
        </div>

        {/* Index */}
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
          {index + 1}
        </div>

        {/* Selected overlay */}
        {isSelected && (
          <div className="absolute inset-0 bg-yellow-400/20 rounded-xl border-2 border-yellow-400 animate-pulse"></div>
        )}
      </div>

      {/* Context Menu for Battle Teams */}
      {isContextMenuVisible && battleTeams && battleTeams.length > 0 && (
        <div 
          className="fixed bg-black/90 border border-yellow-400/50 rounded-lg shadow-2xl p-2 z-50 min-w-48"
          style={{ 
            left: contextMenuPosition.x, 
            top: contextMenuPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="text-yellow-300 text-sm font-semibold mb-2 px-2">
            <FaTrophy className="inline mr-1" />
            Añadir a Equipo de Batalla
          </div>
          {battleTeams.map((team) => (
            <div key={team.id} className="mb-2 last:mb-0">
              <div className="text-white text-xs font-medium px-2 mb-1">{team.name}</div>
              <div className="grid grid-cols-6 gap-1 px-2">
                {Array.from({ length: 6 }, (_, position) => {
                  const isOccupied = team.pokemon[position] !== null
                  return (
                    <button
                      key={position}
                      onClick={() => addToBattleTeam(team.id, position)}
                      disabled={isOccupied}
                      className={`w-6 h-6 border border-dashed rounded flex items-center justify-center text-xs ${
                        isOccupied 
                          ? 'border-red-400/50 bg-red-400/10 cursor-not-allowed' 
                          : 'border-green-400/50 bg-green-400/10 hover:bg-green-400/20'
                      }`}
                      title={isOccupied ? 'Posición ocupada' : `Añadir a posición ${position + 1}`}
                    >
                      {isOccupied ? '✗' : <FaPlus />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
