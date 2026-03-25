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

  const { handlePokemonMove } = usePokemonMovement({
    uuid,
    pcData,
    teamData,
    setPcData,
    setTeamData
  })

  const organizedBoxes = useCallback((): PCBoxData[] => {
    const boxes: PCBoxData[] = []
    
    for (let boxNum = 0; boxNum < TOTAL_BOXES; boxNum++) {
      const boxPokemon: (PCPokemon | null)[] = new Array(POKEMON_PER_BOX).fill(null)
      
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

  const handlePokemonClick = useCallback((pokemon: PCPokemon | null) => {
    setSelectedPokemon(pokemon)
    setSelectedTeamPokemon(null)
  }, [])

  const handleTeamPokemonClick = useCallback((pokemon: PokemonW | null) => {
    setSelectedTeamPokemon(pokemon)
    setSelectedPokemon(null)
  }, [])

  const findAvailableBox = useCallback((requestedBox: number, otherBox: number | null, isMovingForward: boolean = true): number => {
    if (otherBox === null || requestedBox !== otherBox) {
      return requestedBox
    }

    let newBox = requestedBox
    
    if (isMovingForward) {
      newBox = (requestedBox + 1) % totalBoxes
      if (newBox === otherBox) {
        newBox = (requestedBox - 1 + totalBoxes) % totalBoxes
      }
    } else {
      newBox = (requestedBox - 1 + totalBoxes) % totalBoxes
      if (newBox === otherBox) {
        newBox = (requestedBox + 1) % totalBoxes
      }
    }
    
    return newBox
  }, [totalBoxes])

  const boxChange = useCallback((boxNumber: number | null, boxType: 'primary' | 'secondary') => {
    if( boxNumber === null ) return;
    const setChangedBox = boxType === 'primary' ? setCurrentBox : setSecondaryBox
    const currentBoxValue = boxType === 'primary' ? currentBox : secondaryBox
    const otherBox = boxType === 'primary' ? secondaryBox : currentBox

    const safeCurrentBoxValue = currentBoxValue ?? 0
    const isMovingForward = boxNumber > safeCurrentBoxValue || 
                           (boxNumber === 0 && safeCurrentBoxValue === totalBoxes - 1)

    let adjustedBoxNumber = boxNumber
    if (boxNumber < 0) {
      adjustedBoxNumber = totalBoxes - 1
    } else if (boxNumber >= totalBoxes) {
      adjustedBoxNumber = 0
    }

    const finalBoxNumber = findAvailableBox(adjustedBoxNumber, otherBox, isMovingForward)

    setChangedBox(finalBoxNumber)
    setSelectedPokemon(null)
    setSelectedTeamPokemon(null)
  }, [totalBoxes, currentBox, secondaryBox, findAvailableBox])

  const handleBoxChange = useCallback((boxNumber: number) => {
    boxChange(boxNumber, 'primary')
  }, [boxChange])

  const handleSecondaryBoxChange = useCallback((boxNumber: number | null) => {
    boxChange(boxNumber, 'secondary')
  }, [boxChange])

  const toggleDualBoxMode = useCallback(() => {
    if (isDualBoxMode) {
      setSecondaryBox(null)
      setIsDualBoxMode(false)
    } else {
      const nextBox = findAvailableBox((currentBox + 1) % totalBoxes, currentBox, true)
      setSecondaryBox(nextBox)
      setIsDualBoxMode(true)
    }
    setSelectedPokemon(null)
    setSelectedTeamPokemon(null)
  }, [isDualBoxMode, currentBox, totalBoxes, findAvailableBox])

  const clearSelections = useCallback(() => {
    setSelectedPokemon(null)
    setSelectedTeamPokemon(null)
  }, [])

  const handleMove = useCallback((
    source: { type: 'box' | 'team', boxNumber?: number, index: number },
    destination: { type: 'box' | 'team', boxNumber?: number, index: number }
  ) => {
    handlePokemonMove(source as DragSource, destination as DragDestination)
  }, [handlePokemonMove])

  return {
    currentBox,
    secondaryBox,
    isDualBoxMode,
    boxes,
    totalBoxes,
    currentBoxData,
    secondaryBoxData,
    selectedPokemon,
    selectedTeamPokemon,

    handlePokemonClick,
    handleTeamPokemonClick,
    handleBoxChange,
    handleSecondaryBoxChange,
    toggleDualBoxMode,
    handlePokemonMove: handleMove,
    clearSelections,
    
    // Export direct setters for advanced use cases (like filter-aware navigation)
    setSecondaryBox
  }
}