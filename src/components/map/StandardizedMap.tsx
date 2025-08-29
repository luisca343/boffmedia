import React, { useState, useRef, useEffect } from 'react';

// Map constants - same as taxi system
export const MAP_CONSTANTS_OLD = {
  FIXED_MAP_SIZE_X: 2048,
  FIXED_MAP_SIZE_Z: 2048 * 1.09523809524,
  WORLD_BOUNDS: {
    minX: -5120,
    maxX: 5631,
    minZ: -6144,
    maxZ: 5631
  }
};

export const MAP_CONSTANTS = {
  FIXED_MAP_SIZE_X: 2048,
  FIXED_MAP_SIZE_Z: 2048,
  WORLD_BOUNDS: {
    minX: -6463,
    maxX: 6463,
    minZ: -6463,
    maxZ: 6463
  }
};

export interface Position {
  x: number;
  z: number;
}

export interface MapBounds {
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

export class CoordinateTransformer {
  private mapBounds: MapBounds;

  constructor(mapBounds: MapBounds) {
    this.mapBounds = mapBounds;
  }

  worldToMapPixels(worldX: number, worldZ: number): Position {
    const normalizedX = (worldX + 64 - this.mapBounds.minX) / (this.mapBounds.maxX - this.mapBounds.minX);
    const normalizedZ = (worldZ - 32 - this.mapBounds.minZ) / (this.mapBounds.maxZ - this.mapBounds.minZ);

    return {
      x: normalizedX * MAP_CONSTANTS.FIXED_MAP_SIZE_X,
      z: normalizedZ * MAP_CONSTANTS.FIXED_MAP_SIZE_Z
    };
  }

  mapPixelsToWorld(mapX: number, mapZ: number): Position {
    const normalizedX = mapX / MAP_CONSTANTS.FIXED_MAP_SIZE_X;
    const normalizedZ = mapZ / MAP_CONSTANTS.FIXED_MAP_SIZE_Z;
    
      return {
        x: this.mapBounds.minX + normalizedX * (this.mapBounds.maxX - this.mapBounds.minX) - 64,
        z: this.mapBounds.minZ + normalizedZ * (this.mapBounds.maxZ - this.mapBounds.minZ) + 32
      };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorldCoords(
    screenX: number, 
    screenY: number, 
    mapCenter: Position, 
    zoomLevel: number, 
    viewportWidth: number, 
    viewportHeight: number
  ): Position | null {
    // Calculate screen position relative to map center
    const centerOffsetX = screenX - viewportWidth / 2;
    const centerOffsetY = screenY - viewportHeight / 2;

    // Convert screen offset to map pixels (account for zoom)
    const mapPixelX = centerOffsetX / zoomLevel;
    const mapPixelY = centerOffsetY / zoomLevel;

    // Convert map center to map pixels
    const centerMapPos = this.worldToMapPixels(mapCenter.x, mapCenter.z);

    // Calculate actual map pixel position
    const actualMapPixelX = centerMapPos.x + mapPixelX;
    const actualMapPixelZ = centerMapPos.z + mapPixelY;

    // Convert back to world coordinates
    return this.mapPixelsToWorld(actualMapPixelX, actualMapPixelZ);
  }
}

// Additional interfaces and classes for taxi system compatibility
export interface StopPosition {
  actualX: number;
  actualZ: number;
  edgeX: number;
  edgeZ: number;
  isWithinView: boolean;
  angle: number;
}

export interface UI_CONSTANTS_TYPE {
  VIEWPORT_MARGIN: number;
  EDGE_BOUNDARY: number;
}

export const UI_CONSTANTS: UI_CONSTANTS_TYPE = {
  VIEWPORT_MARGIN: 5,
  EDGE_BOUNDARY: 45
};

/**
 * Position calculation utilities for taxi system compatibility
 */
export class PositionCalculator {
  private transformer: CoordinateTransformer;

  constructor(transformer: CoordinateTransformer) {
    this.transformer = transformer;
  }

  /**
   * Calculate if a stop is within viewport and get its position
   */
  calculateStopPosition(
    stop: Position,
    mapCenter: Position,
    zoomLevel: number,
    viewportWidth: number,
    viewportHeight: number
  ): StopPosition {
    const stopMapPos = this.transformer.worldToMapPixels(stop.x, stop.z);
    const centerMapPos = this.transformer.worldToMapPixels(mapCenter.x, mapCenter.z);

    const mapCenterViewportX = viewportWidth / 2;
    const mapCenterViewportY = viewportHeight / 2;

    const mapTopLeftX = mapCenterViewportX - (centerMapPos.x * zoomLevel);
    const mapTopLeftY = mapCenterViewportY - (centerMapPos.z * zoomLevel);

    const stopViewportX = mapTopLeftX + (stopMapPos.x * zoomLevel);
    const stopViewportY = mapTopLeftY + (stopMapPos.z * zoomLevel);

    const viewportX = (stopViewportX / viewportWidth) * 100;
    const viewportZ = (stopViewportY / viewportHeight) * 100;

    const isWithinView = this.isWithinViewport(viewportX, viewportZ);
    const { edgeX, edgeZ } = this.calculateEdgePosition(viewportX, viewportZ, isWithinView);
    const angle = Math.atan2(viewportZ - 50, viewportX - 50) * (180 / Math.PI);

    return {
      actualX: Math.max(0, Math.min(100, viewportX)),
      actualZ: Math.max(0, Math.min(100, viewportZ)),
      edgeX: Math.max(5, Math.min(95, edgeX)),
      edgeZ: Math.max(5, Math.min(95, edgeZ)),
      isWithinView,
      angle,
    };
  }

  private isWithinViewport(viewportX: number, viewportZ: number): boolean {
    const margin = UI_CONSTANTS.VIEWPORT_MARGIN;
    return viewportX >= margin && viewportX <= (100 - margin) && 
           viewportZ >= margin && viewportZ <= (100 - margin);
  }

  private calculateEdgePosition(
    viewportX: number, 
    viewportZ: number, 
    isWithinView: boolean
  ): { edgeX: number; edgeZ: number } {
    if (isWithinView) {
      return { edgeX: viewportX, edgeZ: viewportZ };
    }

    const centerX = 50;
    const centerZ = 50;
    const deltaX = viewportX - centerX;
    const deltaZ = viewportZ - centerZ;
    
    const absX = Math.abs(deltaX);
    const absZ = Math.abs(deltaZ);
    const boundary = UI_CONSTANTS.EDGE_BOUNDARY;
    
    let edgeX = viewportX;
    let edgeZ = viewportZ;

    if (absX > absZ) {
      edgeX = centerX + Math.sign(deltaX) * boundary;
      edgeZ = centerZ + deltaZ * (boundary / absX);
    } else {
      edgeZ = centerZ + Math.sign(deltaZ) * boundary;
      edgeX = centerX + deltaX * (boundary / absZ);
    }

    return { edgeX, edgeZ };
  }
}

interface MapImageProps {
  zoomLevel: number;
  mapCenter: Position;
  transformer: CoordinateTransformer;
  children: React.ReactNode;
}

export function MapImage({ zoomLevel, mapCenter, transformer, children }: MapImageProps) {
  const centerMapPos = transformer.worldToMapPixels(mapCenter.x, mapCenter.z);
  const offsetX = ((MAP_CONSTANTS.FIXED_MAP_SIZE_X / 2 - centerMapPos.x) * zoomLevel);
  const offsetY = ((MAP_CONSTANTS.FIXED_MAP_SIZE_Z / 2 - centerMapPos.z) * zoomLevel);

  return (
    <div 
      className="absolute"
      style={{
        width: `${MAP_CONSTANTS.FIXED_MAP_SIZE_X * zoomLevel}px`,
        height: `${MAP_CONSTANTS.FIXED_MAP_SIZE_Z * zoomLevel}px`,
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
      }}
    >
      <img
        src="/smartrotom/img/TERASv7.avif"
        alt="Minecraft Map"
        className="w-full h-full object-cover"
        draggable={false}
      />
      {children}
    </div>
  );
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

  // Create transformer for coordinate conversion
  const transformer = React.useMemo(() => new CoordinateTransformer(mapBounds), [mapBounds]);

  // Enhanced wheel event handling with useEffect for passive: false
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const delta = e.deltaY > 0 ? -0.5 : 0.5;
      onZoomChange(Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta)));
    };

    // Add event listener with passive: false to ensure preventDefault works
    mapElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, onZoomChange, minZoom, maxZoom]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX, 
      y: e.clientY,
      centerX: mapCenter.x,
      centerZ: mapCenter.z
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX,
        y: touch.clientY,
        centerX: mapCenter.x,
        centerZ: mapCenter.z
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent page scrolling on touch devices
    e.preventDefault();
    
    if (!isDragging || !dragStart || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    const worldDeltaX = -(deltaX / zoomLevel) * (mapBounds.maxX - mapBounds.minX) / MAP_CONSTANTS.FIXED_MAP_SIZE_X;
    const worldDeltaZ = -(deltaY / zoomLevel) * (mapBounds.maxZ - mapBounds.minZ) / MAP_CONSTANTS.FIXED_MAP_SIZE_Z;

    onMapCenterChange({
      x: dragStart.centerX + worldDeltaX,
      z: dragStart.centerZ + worldDeltaZ,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapRef}
        className={`relative bg-slate-800 rounded-xl overflow-hidden shadow-lg border ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ 
          height: '100%',
          // Prevent text selection during drag
          userSelect: 'none',
          // Prevent touch actions that might interfere with map interaction
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <MapImage
          zoomLevel={zoomLevel}
          mapCenter={mapCenter}
          transformer={transformer}
        >
          {children}
        </MapImage>

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
      </div>
    </div>
  );
}