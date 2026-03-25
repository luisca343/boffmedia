import React from 'react';
import { MAP_CONSTANTS } from '@/components/common/map/StandardizedMap';
import type { CoordinateTransformer, Position } from '@/components/common/map/StandardizedMap';
import { CompleteMarker } from './CompleteMarker';
import { BoundaryOverlay } from './BoundaryOverlay';
import { PiHouse, PiBuilding, PiSparkle } from "react-icons/pi";
import { BaseMarker } from '@/components/common/map/BaseMarker';

interface MarkerProps {
  worldPosition: Position;
  transformer: CoordinateTransformer;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MapMarker({ worldPosition, transformer, children, onClick, className = "" }: MarkerProps) {
  return (
    <BaseMarker
      worldPosition={worldPosition}
      transformer={transformer}
      onClick={onClick}
      className={className}
    >
      {children}
    </BaseMarker>
  );
}

interface PropertyMarkerProps {
  worldPosition: Position;
  transformer: CoordinateTransformer;
  property: any;
  isSelected: boolean;
  onClick: () => void;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function PropertyMarker({ 
  worldPosition, 
  transformer, 
  property, 
  isSelected, 
  onClick, 
  colorClaro, 
  colorMedio, 
  colorOscuro 
}: PropertyMarkerProps) {
  return (
    <MapMarker 
      worldPosition={worldPosition} 
      transformer={transformer} 
      onClick={onClick}
      className="group z-20"
    >
      <CompleteMarker
        isSelected={isSelected}
        icon={PiHouse}
        label={`#${property.id} - ${property.name}`}
        variant="property"
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />
    </MapMarker>
  );
}

interface BusinessMarkerProps {
  worldPosition: Position;
  transformer: CoordinateTransformer;
  business: any;
  isSelected: boolean;
  onClick: () => void;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function BusinessMarker({ 
  worldPosition, 
  transformer, 
  business, 
  isSelected, 
  onClick, 
  colorClaro, 
  colorMedio, 
  colorOscuro 
}: BusinessMarkerProps) {
  return (
    <MapMarker 
      worldPosition={worldPosition} 
      transformer={transformer} 
      onClick={onClick}
      className="group z-20"
    >
      <CompleteMarker
        icon={PiBuilding}
        isSelected={isSelected}
        label={`Local #${business.id} - ${business.name}`}
        variant="business"
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />
    </MapMarker>
  );
}

interface AmenityMarkerProps {
  worldPosition: Position;
  transformer: CoordinateTransformer;
  amenity: any;
  isSelected: boolean;
  onClick: () => void;
  colorOscuro: string;
}

export function AmenityMarker({ worldPosition, transformer, amenity, isSelected, onClick, colorOscuro }: AmenityMarkerProps) {
  return (
    <MapMarker 
      worldPosition={worldPosition} 
      transformer={transformer}
      onClick={onClick}
      className="group z-20"
    >
      <CompleteMarker
        variant='amenity'
        isSelected={isSelected}
        colorOscuro={colorOscuro}
        label={amenity.name}
        icon={PiSparkle}
      />
    </MapMarker>
  );
}

interface BoundaryMarkerProps {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  transformer: CoordinateTransformer;
  color: string;
}

export function BoundaryMarker({ bounds, transformer, color }: BoundaryMarkerProps) {
  const topLeft = transformer.worldToMapPixels(bounds.minX, bounds.minZ);
  const bottomRight = transformer.worldToMapPixels(bounds.maxX, bounds.maxZ);
  
  const leftPercent = (topLeft.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const topPercent = (topLeft.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;
  const widthPercent = ((bottomRight.x - topLeft.x) / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const heightPercent = ((bottomRight.z - topLeft.z) / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;

  return (
    <BoundaryOverlay
      leftPercent={leftPercent}
      topPercent={topPercent}
      widthPercent={widthPercent}
      heightPercent={heightPercent}
      color={color}
    />
  );
}
