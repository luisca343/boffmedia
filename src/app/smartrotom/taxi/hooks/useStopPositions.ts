import { useMemo } from 'react';
import { TaxiStop } from "@/types/dto/taxi-stop.dto";
import { Position, StopPosition, MapBounds } from '../types/map.types';
import { PositionCalculator } from '../utils/coordinate-utils';

interface UseStopPositionsProps {
  taxiStops: TaxiStop[];
  mapCenter: Position;
  zoomLevel: number;
  mapBounds: MapBounds;
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
    if (!viewportWidth || !viewportHeight) return [];
    
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
  }, [taxiStops, mapCenter, zoomLevel, mapBounds.minX, mapBounds.maxX, mapBounds.minZ, mapBounds.maxZ, positionCalculator, viewportWidth, viewportHeight]);
};
