import React from 'react';

/**
 * Drag and drop utilities for Pokemon PC components
 */

export interface DragSource {
  type: 'box' | 'team';
  boxNumber?: number;
  index: number;
}

export interface DragDestination {
  type: 'box' | 'team';
  boxNumber?: number;
  index: number;
}

export interface DragData {
  pokemon: any;
  source: string;
  sourceIndex: number;
  boxNumber?: number;
}

/**
 * Creates drag data for transferring Pokemon between slots
 */
export function createDragData(pokemon: any, source: 'box' | 'team', sourceIndex: number, boxNumber?: number): DragData {
  return {
    pokemon,
    source,
    sourceIndex,
    boxNumber
  };
}

/**
 * Parses drag data from a drop event
 */
export function parseDragData(dataTransfer: DataTransfer): DragData | null {
  try {
    const data = dataTransfer.getData('application/json');
    if (!data) return null;
    
    return JSON.parse(data) as DragData;
  } catch (error) {
    console.error('Error parsing drag data:', error);
    return null;
  }
}

/**
 * Standard drag start handler for Pokemon slots
 */
export function handlePokemonDragStart(
  e: React.DragEvent,
  pokemon: any,
  source: 'box' | 'team',
  sourceIndex: number,
  boxNumber?: number
): void {
  if (!pokemon) return;
  
  const dragData = createDragData(pokemon, source, sourceIndex, boxNumber);
  
  e.dataTransfer.setData('application/json', JSON.stringify(dragData));
  e.dataTransfer.effectAllowed = 'move';
}

/**
 * Standard drag over handler
 */
export function handlePokemonDragOver(e: React.DragEvent): void {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

/**
 * Standard drop handler that calls the provided move function
 */
export function handlePokemonDrop(
  e: React.DragEvent,
  destinationType: 'box' | 'team',
  destinationIndex: number,
  onPokemonMove: (source: DragSource, destination: DragDestination) => void,
  destinationBoxNumber?: number
): boolean {
  e.preventDefault();
  
  const dragData = parseDragData(e.dataTransfer);
  if (!dragData) return false;
  
  const source: DragSource = {
    type: dragData.source as 'box' | 'team',
    index: dragData.sourceIndex,
    boxNumber: dragData.boxNumber
  };
  
  const destination: DragDestination = {
    type: destinationType,
    index: destinationIndex,
    boxNumber: destinationBoxNumber
  };
  
  onPokemonMove(source, destination);
  return true;
}

/**
 * Hook for managing drag and drop state
 */
export function useDragDropState() {
  const [isDragOver, setIsDragOver] = React.useState(false);
  
  const handleDragEnter = () => setIsDragOver(true);
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = () => setIsDragOver(false);
  
  return {
    isDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
}

/**
 * Validates if a drag and drop operation is allowed
 */
export function isDragDropAllowed(
  source: DragSource,
  destination: DragDestination,
  options?: {
    allowSameSlot?: boolean;
    allowBoxToBox?: boolean;
    allowTeamToTeam?: boolean;
    allowBoxToTeam?: boolean;
    allowTeamToBox?: boolean;
  }
): boolean {
  const {
    allowSameSlot = false,
    allowBoxToBox = true,
    allowTeamToTeam = true,
    allowBoxToTeam = true,
    allowTeamToBox = true
  } = options || {};
  
  // Check if dropping on the same slot
  if (!allowSameSlot && 
      source.type === destination.type && 
      source.index === destination.index &&
      source.boxNumber === destination.boxNumber) {
    return false;
  }
  
  // Check movement type permissions
  if (source.type === 'box' && destination.type === 'box' && !allowBoxToBox) return false;
  if (source.type === 'team' && destination.type === 'team' && !allowTeamToTeam) return false;
  if (source.type === 'box' && destination.type === 'team' && !allowBoxToTeam) return false;
  if (source.type === 'team' && destination.type === 'box' && !allowTeamToBox) return false;
  
  return true;
}
