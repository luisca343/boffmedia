// Common types for the PC components

// Base drag and drop types (compatible with dnd-kit)
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

// Context menu position
export interface ContextMenuPosition {
  x: number
  y: number
}

// Move result from API
export interface MoveResult {
  success: boolean
  error?: string
}
