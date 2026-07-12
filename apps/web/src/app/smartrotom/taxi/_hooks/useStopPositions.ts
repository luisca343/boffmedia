import { useMemo } from 'react';
import { TaxiStop } from "@boffmedia/shared";
import { Position, MapBounds, PositionCalculator, StopPosition } from '@/components/shared/map/StandardizedMap';

interface UseStopPositionsProps {
  taxiStops: TaxiStop[];
  mapCenter: Position;
  zoomLevel: number;
  mapBounds?: MapBounds; // Make optional to handle undefined case
  positionCalculator: PositionCalculator;
  viewportWidth: number;
  viewportHeight: number;
}

export const useStopPositions = ({
  taxiStops,
  mapCenter,
  zoomLevel,
  mapBounds,
  positionCalculator,
  viewportWidth,
  viewportHeight
}: UseStopPositionsProps) => {
  return useMemo(() => {
    if (!viewportWidth || !viewportHeight || !mapBounds) return [];
    
    return taxiStops.map(stop => ({
      stop,
      pos: positionCalculator.calculateStopPosition(
        stop,
        mapCenter,
        zoomLevel,
        viewportWidth,
        viewportHeight
      )
    }));
  }, [
    taxiStops, 
    mapCenter, 
    zoomLevel, 
    mapBounds, // Just use mapBounds as a whole object instead of accessing properties
    positionCalculator, 
    viewportWidth, 
    viewportHeight
  ]);
};
