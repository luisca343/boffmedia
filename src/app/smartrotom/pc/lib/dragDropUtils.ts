import { DragData, DragSource, DragDestination } from '../types/dragDrop'
import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'

/**
 * Creates drag data for transferring Pokemon information during drag operations
 */
export const createDragData = (
  pokemon: PCPokemon | PokemonW,
  source: 'box' | 'team',
  index: number,
  boxNumber?: number
): DragData => {
  return {
    pokemon,
    source,
    sourceIndex: index,
    boxNumber
  }
}

/**
 * Parses drag data from a drop event
 */
export const parseDragData = (dataTransfer: DataTransfer): DragData | null => {
  try {
    const data = dataTransfer.getData('application/json')
    if (!data) return null
    
    const parsed = JSON.parse(data)
    
    // Validate the structure
    if (!parsed.pokemon || !parsed.source || parsed.sourceIndex === undefined) {
      return null
    }
    
    return parsed as DragData
  } catch (error) {
    console.error('Error parsing drag data:', error)
    return null
  }
}

/**
 * Sets up drag transfer data for an element
 */
export const setupDragTransfer = (
  dataTransfer: DataTransfer,
  dragData: DragData
): void => {
  dataTransfer.setData('application/json', JSON.stringify(dragData))
  dataTransfer.effectAllowed = 'move'
}

/**
 * Configures drop effect for drag over events
 */
export const configureDragOver = (e: React.DragEvent): void => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

/**
 * Creates move operation from drag source and destination
 */
export const createMoveOperation = (
  source: DragSource,
  destination: DragDestination
) => {
  return { source, destination }
}

/**
 * Converts drag data to move source
 */
export const dragDataToSource = (dragData: DragData): DragSource => {
  return {
    type: dragData.source,
    boxNumber: dragData.boxNumber,
    index: dragData.sourceIndex
  }
}

/**
 * Validates if a move operation is valid
 */
export const isValidMove = (
  source: DragSource,
  destination: DragDestination
): boolean => {
  // Can't move to the same slot
  if (
    source.type === destination.type &&
    source.boxNumber === destination.boxNumber &&
    source.index === destination.index
  ) {
    return false
  }
  
  // Validate box numbers exist
  if (source.type === 'box' && source.boxNumber === undefined) {
    return false
  }
  
  if (destination.type === 'box' && destination.boxNumber === undefined) {
    return false
  }
  
  return true
}

/**
 * Determines if two positions represent the same slot
 */
export const isSameSlot = (
  pos1: { type: 'box' | 'team', boxNumber?: number, index: number },
  pos2: { type: 'box' | 'team', boxNumber?: number, index: number }
): boolean => {
  return (
    pos1.type === pos2.type &&
    pos1.boxNumber === pos2.boxNumber &&
    pos1.index === pos2.index
  )
}
