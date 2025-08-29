import React, { useState, useMemo, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

// Map constants - same as taxi system
const MAP_CONSTANTS = {
  FIXED_MAP_SIZE_X: 2048,
  FIXED_MAP_SIZE_Z: 2048 * 1.09523809524,
  WORLD_BOUNDS: {
    minX: -5120,
    maxX: 5631,
    minZ: -6144,
    maxZ: 5631
  }
};

interface Position {
  x: number;
  z: number;
}

interface MapBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface StandardizedMapProps {
  mapCenter: Position;
  zoomLevel: number;
  onMapCenterChange: (center: Position) => void;
  onZoomChange: (zoom: number) => void;
  children: React.ReactNode;
  className?: string;
  showControls?: boolean;
  minZoom?: number;
  maxZoom?: number;
  mapBounds?: MapBounds;
}

class CoordinateTransformer {
  private mapBounds: MapBounds;

  constructor(mapBounds: MapBounds) {
    this.mapBounds = mapBounds;
  }

  worldToMapPixels(worldX: number, worldZ: number): Position {
    const normalizedX = (worldX - this.mapBounds.minX) / (this.mapBounds.maxX - this.mapBounds.minX);
    const normalizedZ = (worldZ - this.mapBounds.minZ) / (this.mapBounds.maxZ - this.mapBounds.minZ);
    
    return {
      x: normalizedX * MAP_CONSTANTS.FIXED_MAP_SIZE_X,
      z: normalizedZ * MAP_CONSTANTS.FIXED_MAP_SIZE_Z
    };
  }

  mapPixelsToWorld(mapX: number, mapZ: number): Position {
    const normalizedX = mapX / MAP_CONSTANTS.FIXED_MAP_SIZE_X;
    const normalizedZ = mapZ / MAP_CONSTANTS.FIXED_MAP_SIZE_Z;

    const worldX = this.mapBounds.minX + normalizedX * (this.mapBounds.maxX - this.mapBounds.minX);
    const worldZ = this.mapBounds.minZ + normalizedZ * (this.mapBounds.maxZ - this.mapBounds.minZ);
    
    return { x: worldX, z: worldZ };
  }
}

export function StandardizedMap({
  mapCenter,
  zoomLevel,
  onMapCenterChange,
  onZoomChange,
  children,
  className = "h-96",
  showControls = true,
  minZoom = 0.2,
  maxZoom = 2,
  mapBounds = MAP_CONSTANTS.WORLD_BOUNDS
}: StandardizedMapProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; centerX: number; centerZ: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const transformer = useMemo(() => new CoordinateTransformer(mapBounds), [mapBounds]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      centerX: mapCenter.x,
      centerZ: mapCenter.z
    });
  }, [mapCenter]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert pixel movement to world coordinates
    const worldDeltaX = -(deltaX / zoomLevel) * (mapBounds.maxX - mapBounds.minX) / MAP_CONSTANTS.FIXED_MAP_SIZE_X;
    const worldDeltaZ = -(deltaY / zoomLevel) * (mapBounds.maxZ - mapBounds.minZ) / MAP_CONSTANTS.FIXED_MAP_SIZE_Z;

    onMapCenterChange({
      x: dragStart.centerX + worldDeltaX,
      z: dragStart.centerZ + worldDeltaZ,
    });
  }, [isDragging, dragStart, zoomLevel, mapBounds, onMapCenterChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
    onZoomChange(newZoom);
  }, [zoomLevel, minZoom, maxZoom, onZoomChange]);

  // Calculate the map image positioning - same as taxi system
  const centerMapPos = transformer.worldToMapPixels(mapCenter.x, mapCenter.z);
  const offsetX = ((MAP_CONSTANTS.FIXED_MAP_SIZE_X / 2 - centerMapPos.x) * zoomLevel);
  const offsetY = ((MAP_CONSTANTS.FIXED_MAP_SIZE_Z / 2 - centerMapPos.z) * zoomLevel);

  const mapImageStyle = {
    width: `${MAP_CONSTANTS.FIXED_MAP_SIZE_X * zoomLevel}px`,
    height: `${MAP_CONSTANTS.FIXED_MAP_SIZE_Z * zoomLevel}px`,
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
  };

  return (
    <div className="relative">
      {/* Map container */}
      <div 
        ref={mapRef}
        className={`relative bg-slate-800 rounded-xl overflow-hidden shadow-lg border cursor-move ${className}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Map image layer - same structure as taxi system */}
        <div 
          className="absolute"
          style={mapImageStyle}
        >
          <img
            src="/smartrotom/img/TERASTEST4.webp"
            alt="Minecraft Map"
            className="w-full h-full object-cover"
            draggable={false}
          />
          
          {/* Children are rendered as direct children of the map image */}
          {/* This ensures they move with the map and maintain correct positioning */}
          {children}
        </div>

        {/* Map controls */}
        {showControls && (
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
            <button
              onClick={() => onZoomChange(Math.min(maxZoom, zoomLevel + 0.2))}
              className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform text-gray-700 dark:text-gray-300"
            >
              +
            </button>
            <button
              onClick={() => onZoomChange(Math.max(minZoom, zoomLevel - 0.2))}
              className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform text-gray-700 dark:text-gray-300"
            >
              -
            </button>
          </div>
        )}

        {/* Map info */}
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-2 z-30">
          <p className="text-white text-xs">
            <span className="font-medium">Zoom:</span> {(zoomLevel * 100).toFixed(0)}%
          </p>
          <p className="text-white text-xs">
            <span className="font-medium">Centro:</span> X:{Math.round(mapCenter.x)}, Z:{Math.round(mapCenter.z)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Export utilities for use by markers
export { MAP_CONSTANTS, CoordinateTransformer };
export type { Position, MapBounds };
