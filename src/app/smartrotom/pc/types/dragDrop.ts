import { PCPokemon } from '@/types/dto/pc-pokemon.dto'
import { PokemonW } from '@/generated/api'

// Base drag and drop types
export interface DragSource {
  type: 'box' | 'team'
  boxNumber?: number
  index: number
}

export interface DragDestination {
  type: 'box' | 'team'
  boxNumber?: number
  index: number
}

// Drag data that gets transferred during drag operations
export interface DragData {
  pokemon: PCPokemon | PokemonW
  source: 'box' | 'team'
  boxNumber?: number
  sourceIndex: number
}

// Pokemon move operation
export interface PokemonMoveOperation {
  source: DragSource
  destination: DragDestination
}

// Context menu position
export interface ContextMenuPosition {
  x: number
  y: number
}

// Drag state for visual feedback
export interface DragState {
  isDragOver: boolean
  dragOverIndex?: number | null
}

// Move result from API
export interface MoveResult {
  success: boolean
  error?: string
}
