import React from 'react';
import { Position, CoordinateTransformer, MAP_CONSTANTS } from './StandardizedMap';

interface BaseMarkerProps {
  worldPosition: Position;
  transformer: CoordinateTransformer;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function BaseMarker({ 
  worldPosition, 
  transformer, 
  children, 
  onClick, 
  className = "",
  style = {}
}: BaseMarkerProps) {
  const mapPos = transformer.worldToMapPixels(worldPosition.x, worldPosition.z);
  const leftPercent = (mapPos.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const topPercent = (mapPos.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;

  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${className}`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        ...style
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

export type { Position, CoordinateTransformer };
