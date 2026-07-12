import { useState, useEffect } from 'react';
import { Position, MapBounds } from '@/components/shared/map/StandardizedMap';
import { MAP_CONSTANTS, ZOOM_CONSTANTS } from '../_utils/constants';

interface UseMapStateProps {
  playerPosition: Position;
  customMapBounds?: MapBounds;
}

export const useMapState = ({ playerPosition, customMapBounds }: UseMapStateProps) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<Position>(playerPosition);
  const [mapBounds, setMapBounds] = useState(
    customMapBounds || MAP_CONSTANTS.WORLD_BOUNDS
  );

  useEffect(() => {
    if (customMapBounds) {
      setMapBounds(customMapBounds);
    }
  }, [customMapBounds]);

  const handleZoom = (delta: number) => {
    const newZoom = delta < 0 
      ? Math.min(ZOOM_CONSTANTS.MAX_ZOOM, zoomLevel * ZOOM_CONSTANTS.ZOOM_FACTOR)
      : Math.max(ZOOM_CONSTANTS.MIN_ZOOM, zoomLevel / ZOOM_CONSTANTS.ZOOM_FACTOR);
    setZoomLevel(newZoom);
  };

  const centerMapOnPosition = (position: Position) => {
    setMapCenter({ x: position.x, z: position.z });
  };

  const resetMapCenter = () => {
    setMapCenter({ x: playerPosition.x, z: playerPosition.z });
  };

  const calculateVisibleDistance = () => {
    const worldWidth = mapBounds.maxX - mapBounds.minX;
    const worldHeight = mapBounds.maxZ - mapBounds.minZ;
    return Math.round(Math.max(worldWidth, worldHeight));
  };

  return {
    zoomLevel,
    mapCenter,
    mapBounds,
    handleZoom,
    centerMapOnPosition,
    resetMapCenter,
    calculateVisibleDistance,
    setMapCenter
  };
};
