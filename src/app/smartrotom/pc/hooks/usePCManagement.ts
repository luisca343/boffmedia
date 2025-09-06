import { useState, useCallback } from 'react'
import { PCPokemon, PCBoxData } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'
import { DragSource, DragDestination } from '../types/common'
import { usePokemonMovement } from './usePokemonMovement'
import { POKEMON_PER_BOX, TOTAL_BOXES } from '../utils/constants'

interface UsePCManagementProps {
  uuid: string
  pcData: PCPokemon[]
  teamData: (PokemonW | null)[]
  setPcData: (data: PCPokemon[]) => void
  setTeamData: (data: (PokemonW | null)[]) => void
}

export const usePCManagement = ({
  uuid,
  pcData,
  teamData,
  setPcData,
  setTeamData
}: UsePCManagementProps) => {
  const [currentBox, setCurrentBox] = useState(0)
  const [secondaryBox, setSecondaryBox] = useState<number | null>(null)
  const [isDualBoxMode, setIsDualBoxMode] = useState(false)
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
  const secondaryBoxData = secondaryBox !== null ? (boxes[secondaryBox] || { 
    boxNumber: secondaryBox, 
    pokemon: new Array(POKEMON_PER_BOX).fill(null) 
  }) : null

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

  // Handle secondary box change
  const handleSecondaryBoxChange = useCallback((boxNumber: number | null) => {
    if (boxNumber === null || (boxNumber >= 0 && boxNumber < totalBoxes)) {
      setSecondaryBox(boxNumber)
      setSelectedPokemon(null)
      setSelectedTeamPokemon(null)
    }
  }, [totalBoxes, currentBox])

  // Toggle dual box mode
  const toggleDualBoxMode = useCallback(() => {
    if (isDualBoxMode) {
      setSecondaryBox(null)
      setIsDualBoxMode(false)
    } else {
      // Set secondary box to next box if available
      const nextBox = currentBox + 1 < totalBoxes ? currentBox + 1 : (currentBox > 0 ? currentBox - 1 : null)
      setSecondaryBox(nextBox)
      setIsDualBoxMode(true)
    }
    setSelectedPokemon(null)
    setSelectedTeamPokemon(null)
  }, [isDualBoxMode, currentBox, totalBoxes])

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
    secondaryBox,
    isDualBoxMode,
    boxes,
    totalBoxes,
    currentBoxData,
    secondaryBoxData,
    selectedPokemon,
    selectedTeamPokemon,

    // Actions
    handlePokemonClick,
    handleTeamPokemonClick,
    handleBoxChange,
    handleSecondaryBoxChange,
    toggleDualBoxMode,
    handlePokemonMove: handleMove,
    clearSelections
  }
}
