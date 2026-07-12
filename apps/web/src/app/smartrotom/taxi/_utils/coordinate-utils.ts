import { MAP_CONSTANTS } from '@/components/shared/map/StandardizedMap';
import type { Position, MapBounds } from '@/components/shared/map/StandardizedMap';

export function calculateWorldMovementDelta(
  deltaPixelsX: number,
  deltaPixelsY: number,
  zoomLevel: number,
  mapBounds: MapBounds
): Position {
  const worldWidth = mapBounds.maxX - mapBounds.minX;
  const worldHeight = mapBounds.maxZ - mapBounds.minZ;
  
  return {
    x: -(deltaPixelsX / zoomLevel) * (worldWidth / MAP_CONSTANTS.FIXED_MAP_SIZE_X),
    z: -(deltaPixelsY / zoomLevel) * (worldHeight / MAP_CONSTANTS.FIXED_MAP_SIZE_Z)
  };
}
