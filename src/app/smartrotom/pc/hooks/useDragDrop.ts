import { useState, useCallback } from 'react'
import { 
  DragData, 
  DragSource, 
  DragDestination, 
  PokemonMoveOperation,
  DragState 
} from '../types/dragDrop'
import { 
  parseDragData, 
  setupDragTransfer, 
  configureDragOver,
  createDragData,
  dragDataToSource,
  createMoveOperation,
  isValidMove
} from '../lib/dragDropUtils'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'

interface UseDragDropProps {
  onPokemonMove: (source: DragSource, destination: DragDestination) => void
  onDragStateChange?: (state: DragState) => void
}

export const useDragDrop = ({ onPokemonMove, onDragStateChange }: UseDragDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragOver: false,
    dragOverIndex: null
  })

  // Update drag state and notify parent
  const updateDragState = useCallback((newState: Partial<DragState>) => {
    const updated = { ...dragState, ...newState }
    setDragState(updated)
    onDragStateChange?.(updated)
  }, [dragState, onDragStateChange])

  // Handle drag start
  const handleDragStart = useCallback((
    e: React.DragEvent,
    pokemon: PCPokemon | PokemonW,
    source: 'box' | 'team',
    index: number,
    boxNumber?: number
  ) => {
    const dragData = createDragData(pokemon, source, index, boxNumber)
    setupDragTransfer(e.dataTransfer, dragData)
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    configureDragOver(e)
    updateDragState({ isDragOver: true })
  }, [updateDragState])

  // Handle drag enter with index tracking
  const handleDragEnter = useCallback((index?: number) => {
    updateDragState({ isDragOver: true, dragOverIndex: index })
  }, [updateDragState])

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    updateDragState({ isDragOver: false, dragOverIndex: null })
  }, [updateDragState])

  // Handle drop
  const handleDrop = useCallback((
    e: React.DragEvent,
    destinationType: 'box' | 'team',
    destinationIndex: number,
    destinationBoxNumber?: number
  ) => {
    e.preventDefault()
    updateDragState({ isDragOver: false, dragOverIndex: null })

    const dragData = parseDragData(e.dataTransfer)
    if (!dragData) {
      console.error('Invalid drag data')
      return
    }

    const source = dragDataToSource(dragData)
    const destination: DragDestination = {
      type: destinationType,
      index: destinationIndex,
      boxNumber: destinationBoxNumber
    }

    if (!isValidMove(source, destination)) {
      console.warn('Invalid move operation')
      return
    }

    onPokemonMove(source, destination)
  }, [onPokemonMove, updateDragState])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  }
}

// Specialized hook for box slots
export const useBoxSlotDragDrop = (
  currentBox: number,
  slotIndex: number,
  onPokemonMove: (source: DragSource, destination: DragDestination) => void
) => {
  const { dragState, handleDragStart, handleDragOver, handleDragLeave, handleDrop } = useDragDrop({
    onPokemonMove
  })

  const handleSlotDragStart = useCallback((
    e: React.DragEvent,
    pokemon: PCPokemon
  ) => {
    handleDragStart(e, pokemon, 'box', slotIndex, currentBox)
  }, [handleDragStart, slotIndex, currentBox])

  const handleSlotDrop = useCallback((e: React.DragEvent) => {
    handleDrop(e, 'box', slotIndex, currentBox)
  }, [handleDrop, slotIndex, currentBox])

  return {
    isDragOver: dragState.isDragOver,
    handleDragStart: handleSlotDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop: handleSlotDrop
  }
}

// Specialized hook for team slots
export const useTeamSlotDragDrop = (
  slotIndex: number,
  onPokemonMove: (source: DragSource, destination: DragDestination) => void
) => {
  const { dragState, handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop } = useDragDrop({
    onPokemonMove
  })

  const handleTeamDragStart = useCallback((
    e: React.DragEvent,
    pokemon: PokemonW
  ) => {
    handleDragStart(e, pokemon, 'team', slotIndex)
  }, [handleDragStart, slotIndex])

  const handleTeamDrop = useCallback((e: React.DragEvent) => {
    handleDrop(e, 'team', slotIndex)
  }, [handleDrop, slotIndex])

  const handleTeamDragEnter = useCallback(() => {
    handleDragEnter(slotIndex)
  }, [handleDragEnter, slotIndex])

  return {
    isDragOver: dragState.isDragOver,
    dragOverIndex: dragState.dragOverIndex,
    handleDragStart: handleTeamDragStart,
    handleDragOver,
    handleDragEnter: handleTeamDragEnter,
    handleDragLeave,
    handleDrop: handleTeamDrop
  }
}
