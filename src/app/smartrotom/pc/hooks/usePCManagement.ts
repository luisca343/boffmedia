import { useState, useCallback } from 'react'
import { PCPokemon, PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { DragSource, DragDestination } from '../types/dragDrop'
import { usePokemonMovement } from './usePokemonMovement'
import { POKEMON_PER_BOX, TOTAL_BOXES } from '../utils/constants'

interface UsePCManagementProps {
  uuid: string
  pcData: PCPokemon[]
  teamData: PokemonW[]
  setPcData: (data: PCPokemon[]) => void
  setTeamData: (data: PokemonW[]) => void
}

export const usePCManagement = ({
  uuid,
  pcData,
  teamData,
  setPcData,
  setTeamData
}: UsePCManagementProps) => {
  const [currentBox, setCurrentBox] = useState(0)
  const [selectedPokemon, setSelectedPokemon] = useState<PCPokemon | null>(null)
  const [selectedTeamPokemon, setSelectedTeamPokemon] = useState<PokemonW | null>(null)

  // Use the movement hook
  const { handlePokemonMove } = usePokemonMovement({
    uuid,
    pcData,
    teamData,
    setPcData,
    setTeamData
  })

  // Organize Pokemon by box - includes all boxes (even empty ones)
  const organizedBoxes = useCallback((): PCBoxData[] => {
    const boxes: PCBoxData[] = []
    
    // Create all boxes from 0 to TOTAL_BOXES - 1
    for (let boxNum = 0; boxNum < TOTAL_BOXES; boxNum++) {
      const boxPokemon: (PCPokemon | null)[] = new Array(POKEMON_PER_BOX).fill(null)
      
      // Fill with actual Pokemon data if it exists
      const pokemonInBox = pcData.filter(p => p.box === boxNum)
      pokemonInBox.forEach(pokemon => {
        if (pokemon.index >= 0 && pokemon.index < POKEMON_PER_BOX) {
          boxPokemon[pokemon.index] = pokemon
        }
      })
      
      boxes.push({
        boxNumber: boxNum,
        pokemon: boxPokemon
      })
    }
    
    return boxes
  }, [pcData])

  const boxes = organizedBoxes()
  const totalBoxes = TOTAL_BOXES
  const currentBoxData = boxes[currentBox] || { 
    boxNumber: currentBox, 
    pokemon: new Array(POKEMON_PER_BOX).fill(null) 
  }

  // Handle Pokemon selection
  const handlePokemonClick = useCallback((pokemon: PCPokemon | null) => {
    setSelectedPokemon(pokemon)
    setSelectedTeamPokemon(null)
  }, [])

  const handleTeamPokemonClick = useCallback((pokemon: PokemonW | null) => {
    setSelectedTeamPokemon(pokemon)
    setSelectedPokemon(null)
  }, [])

  // Handle box navigation
  const handleBoxChange = useCallback((boxNumber: number) => {
    if (boxNumber >= 0 && boxNumber < totalBoxes) {
      setCurrentBox(boxNumber)
      setSelectedPokemon(null)
      setSelectedTeamPokemon(null)
    }
  }, [totalBoxes])

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedPokemon(null)
    setSelectedTeamPokemon(null)
  }, [])

  // Wrapper for Pokemon move that uses the proper type
  const handleMove = useCallback((
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => {
    handlePokemonMove(source as DragSource, destination as DragDestination)
  }, [handlePokemonMove])

  return {
    // State
    currentBox,
    boxes,
    totalBoxes,
    currentBoxData,
    selectedPokemon,
    selectedTeamPokemon,

    // Actions
    handlePokemonClick,
    handleTeamPokemonClick,
    handleBoxChange,
    handlePokemonMove: handleMove,
    clearSelections
  }
}
