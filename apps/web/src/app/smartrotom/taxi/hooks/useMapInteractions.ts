import { useState, useRef, useCallback } from 'react';
import { Position, DragState, MapBounds } from '../types/map.types';
import { CoordinateTransformer } from '@/components/shared/map/StandardizedMap';
import { calculateWorldMovementDelta } from '../utils/coordinate-utils';
interface UseMapInteractionsProps {
  mapBounds: MapBounds;
  zoomLevel: number;
  mapCenter: Position;
  setMapCenter: (center: Position) => void;
  transformer: CoordinateTransformer;
}

export const useMapInteractions = ({
  mapBounds,
  zoomLevel,
  mapCenter,
  setMapCenter,
  transformer
}: UseMapInteractionsProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastMapCenter: { x: 0, z: 0 }
  });
  const [hoverCoords, setHoverCoords] = useState<Position | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start dragging if clicking on interactive elements
    if ((e.target as HTMLElement).closest('[data-waypoint]') || 
        (e.target as HTMLElement).closest('.waypoint-marker') ||
        (e.target as HTMLElement).closest('.offscreen-indicator')) {
      return;
    }
    
    setDragState({
      isDragging: true,
      dragStart: { x: e.clientX, y: e.clientY },
      lastMapCenter: mapCenter
    });
    e.preventDefault();
  }, [mapCenter]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = mapContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update hover coordinates
    const coords = transformer.screenToWorldCoords(
      mouseX, 
      mouseY, 
      mapCenter, 
      zoomLevel, 
      rect.width, 
      rect.height
    );
    setHoverCoords(coords);

    // Handle dragging
    if (dragState.isDragging) {
      const deltaX = e.clientX - dragState.dragStart.x;
      const deltaY = e.clientY - dragState.dragStart.y;

      const worldDelta = calculateWorldMovementDelta(deltaX, deltaY, zoomLevel, mapBounds);

      setMapCenter({
        x: dragState.lastMapCenter.x + worldDelta.x,
        z: dragState.lastMapCenter.z + worldDelta.z
      });
    }
  }, [dragState, mapCenter, zoomLevel, mapBounds, transformer, setMapCenter]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
    setHoverCoords(null);
  }, []);

  return {
    dragState,
    hoverCoords,
    mapContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  };
};
