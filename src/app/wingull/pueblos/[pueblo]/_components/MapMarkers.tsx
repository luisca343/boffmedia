import React from 'react';
import { Home, Sparkles, Building2 } from 'lucide-react';
import { BaseMarker, MAP_CONSTANTS } from '@/components/map';
import type { CoordinateTransformer, Position } from '@/components/map';

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
      <div className="relative">
        <div 
          className={`w-8 h-8 rounded-full border-3 flex items-center justify-center shadow-lg transition-all duration-200 ${
            isSelected ? 'scale-125' : 'group-hover:scale-110'
          }`}
          style={{
            backgroundColor: isSelected ? colorClaro : 'white',
            borderColor: isSelected ? colorOscuro : colorMedio,
          }}
        >
          <Home 
            className="w-4 h-4" 
            style={{ color: isSelected ? colorOscuro : colorMedio }} 
          />
        </div>

        {/* Property label */}
          <div 
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none z-30 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{
              backgroundColor: isSelected ? colorClaro : colorMedio,
              color: 'white',
            }}
          >
            #{property.id} - {property.name}
          </div>
      </div>
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
      <div className="relative">
        <div 
          className={`w-8 h-8 rounded-full border-3 flex items-center justify-center shadow-lg transition-all duration-200 ${
            isSelected ? 'scale-125' : 'group-hover:scale-110'
          }`}
          style={{
            backgroundColor: isSelected ? colorMedio : 'white',
            borderColor: isSelected ? colorOscuro : colorClaro,
          }}
        >
          <Building2 
            className="w-4 h-4" 
            style={{ color: isSelected ? 'white' : colorMedio }} 
          />
        </div>

        {/* Business label */}
          <div 
            className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none z-30 ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            style={{
              backgroundColor: isSelected ? colorMedio : colorClaro,
              color: 'white',
            }}
          >
            Local #{business.id} - {business.name}
          </div>
      </div>
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
      <div className="relative">
        <div 
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md transition-all duration-200 cursor-pointer hover:scale-110 ${
            isSelected ? 'scale-125' : 'opacity-80 group-hover:opacity-100'
          }`}
          style={{
            backgroundColor: isSelected ? colorOscuro : colorOscuro,
            borderColor: isSelected ? 'white' : 'white',
            boxShadow: isSelected ? `0 0 12px ${colorOscuro}80` : undefined,
          }}
        >
          <Sparkles className={`w-3 h-3 text-white ${isSelected ? 'animate-pulse' : ''}`} />
        </div>
        {/* Amenity tooltip */}
        <div 
          className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-opacity duration-200 pointer-events-none z-30 ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          style={{
            backgroundColor: isSelected ? colorOscuro : colorOscuro,
            color: 'white',
          }}
        >
          {amenity.name}
        </div>
      </div>
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
    <div 
      className="absolute border-4 border-dashed pointer-events-none z-10"
      style={{
        borderColor: color,
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
      }}
    />
  );
}
