// Re-export shared map components to maintain compatibility
export { 
  CoordinateTransformer, 
  PositionCalculator,
  MAP_CONSTANTS,
  UI_CONSTANTS
} from '@/components/map';
export type { Position, MapBounds, StopPosition } from '@/components/map';

import { MAP_CONSTANTS } from '@/components/map';
import type { Position, MapBounds } from '@/components/map';

// Keep taxi-specific utilities here
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
