import { FaMapMarkerAlt, FaArrowRight, FaCompass } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { useState, useRef, useEffect, useMemo } from 'react'

interface Position {
  x: number;
  z: number;
}

interface MapViewProps {
  taxiStops: TaxiStop[];
  playerPosition: Position;
  selectedStop: TaxiStop | null;
  setSelectedStop: (stop: TaxiStop) => void;
  mapBounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  showCoordinates?: boolean;
}

export default function MapView({ 
  taxiStops, 
  playerPosition, 
  selectedStop, 
  setSelectedStop, 
  mapBounds: customMapBounds,
  showCoordinates = false 
}: MapViewProps) {
  // Fixed coordinate system approach
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<Position>(playerPosition); // Initialize to player position
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Fixed map size in pixels - this creates our coordinate system
  // We will adapt the dimensions to the aspect ratio of the image
  const FIXED_MAP_SIZE_X = 2048;
  const FIXED_MAP_SIZE_Z = 2048 * 1.09523809524;

  const [mapBounds, setMapBounds] = useState(customMapBounds || { 
    minX: -5120, maxX: 5631, 
    minZ: -6144, maxZ: 5631
  });

  // Mouse navigation state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastMapCenter, setLastMapCenter] = useState<Position>({ x: 0, z: 0 });
  const [hoverCoords, setHoverCoords] = useState<{ x: number; z: number } | null>(null);

  useEffect(() => {
    if (customMapBounds) {
      setMapBounds(customMapBounds);
    }
  }, [customMapBounds]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = 1.1;
    const newZoom = e.deltaY < 0 
      ? Math.min(5, zoomLevel * zoomFactor)
      : Math.max(0.5, zoomLevel / zoomFactor);
    setZoomLevel(newZoom);
  };

  // Convert world coordinates to fixed map coordinates (0 to FIXED_MAP_SIZE)
  const worldToMapPixels = (worldX: number, worldZ: number) => {
    const normalizedX = (worldX - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX);
    const normalizedZ = (worldZ - mapBounds.minZ) / (mapBounds.maxZ - mapBounds.minZ);
    
    return {
      x: normalizedX * FIXED_MAP_SIZE_X,
      z: normalizedZ * FIXED_MAP_SIZE_Z
    };
  };

  // Convert fixed map coordinates back to world coordinates
  const mapPixelsToWorld = (mapX: number, mapZ: number) => {
    const normalizedX = mapX / FIXED_MAP_SIZE_X;
    const normalizedZ = mapZ / FIXED_MAP_SIZE_Z;

    const worldX = mapBounds.minX + normalizedX * (mapBounds.maxX - mapBounds.minX);
    const worldZ = mapBounds.minZ + normalizedZ * (mapBounds.maxZ - mapBounds.minZ);
    
    return { x: worldX, z: worldZ };
  };

  // Calculate if a stop is within viewport and get its position
  const calculateStopPosition = (stop: TaxiStop | Position & { id?: string }) => {
    const container = mapContainerRef.current;
    if (!container) return { actualX: 50, actualZ: 50, edgeX: 50, edgeZ: 50, isWithinView: true, angle: 0 };

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Convert world coordinates to fixed map coordinates
    const stopMapPos = worldToMapPixels(stop.x, stop.z);
    const centerMapPos = worldToMapPixels(mapCenter.x, mapCenter.z);

    // Calculate where the map center should be positioned in the viewport (pixels from top-left)
    const mapCenterViewportX = viewportWidth / 2;
    const mapCenterViewportY = viewportHeight / 2;

    // Calculate the top-left corner of the scaled map in viewport coordinates
    const mapTopLeftX = mapCenterViewportX - (centerMapPos.x * zoomLevel);
    const mapTopLeftY = mapCenterViewportY - (centerMapPos.z * zoomLevel);

    // Calculate the stop position in viewport coordinates
    const stopViewportX = mapTopLeftX + (stopMapPos.x * zoomLevel);
    const stopViewportY = mapTopLeftY + (stopMapPos.z * zoomLevel);

    // Convert to percentages
    const viewportX = (stopViewportX / viewportWidth) * 100;
    const viewportZ = (stopViewportY / viewportHeight) * 100;

    // Check if within viewport
    const margin = 5; // percent margin inside border
    const isWithinView = viewportX >= margin && viewportX <= (100 - margin) && 
                        viewportZ >= margin && viewportZ <= (100 - margin);

    // Calculate edge position for off-screen markers
    let edgeX = viewportX;
    let edgeZ = viewportZ;

    if (!isWithinView) {
      const centerX = 50;
      const centerZ = 50;
      const deltaX = viewportX - centerX;
      const deltaZ = viewportZ - centerZ;
      
      const absX = Math.abs(deltaX);
      const absZ = Math.abs(deltaZ);
      const boundary = 45; // place edge indicators inside 5% margin
      
      if (absX > absZ) {
        edgeX = centerX + Math.sign(deltaX) * boundary;
        edgeZ = centerZ + deltaZ * (boundary / absX);
      } else {
        edgeZ = centerZ + Math.sign(deltaZ) * boundary;
        edgeX = centerX + deltaX * (boundary / absZ);
      }
    }

    const angle = Math.atan2(viewportZ - 50, viewportX - 50) * (180 / Math.PI);

    return {
      actualX: Math.max(0, Math.min(100, viewportX)),
      actualZ: Math.max(0, Math.min(100, viewportZ)),
      edgeX: Math.max(5, Math.min(95, edgeX)),
      edgeZ: Math.max(5, Math.min(95, edgeZ)),
      isWithinView,
      angle,
    };
  };

  // Function to center the map on a specific stop
  const centerMapOnStop = (stop: TaxiStop) => {
    // Center map on stop with a slight offset so the stop is visible (if desired you can add smoothing)
    setMapCenter({ x: stop.x, z: stop.z });
    setSelectedStop(stop);
  };

  // Reset map center to player position
  const resetMapCenter = () => {
    setMapCenter({ x: playerPosition.x, z: playerPosition.z });
    if (selectedStop) {
      setSelectedStop(selectedStop); // Keep the selection, just recenter
    }
  };

  // Convert screen coordinates to world coordinates for hover display
  const screenToWorldCoords = (screenX: number, screenY: number) => {
    const container = mapContainerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    const centerMapPos = worldToMapPixels(mapCenter.x, mapCenter.z);
    const containerCenterX = viewportWidth / 2;
    const containerCenterY = viewportHeight / 2;
    // Top-left of the scaled map in viewport coords:
    const mapTopLeftX = containerCenterX - (centerMapPos.x * zoomLevel);
    const mapTopLeftY = containerCenterY - (centerMapPos.z * zoomLevel);

    const mapPosX = (screenX - mapTopLeftX) / zoomLevel;
    const mapPosZ = (screenY - mapTopLeftY) / zoomLevel;

    // Convert back to world coordinates
    const worldCoords = mapPixelsToWorld(mapPosX, mapPosZ);
    // Optional: clamp to bounds to avoid tiny overflows at edges
    return {
      x: Math.round(Math.max(mapBounds.minX, Math.min(mapBounds.maxX, worldCoords.x))),
      z: Math.round(Math.max(mapBounds.minZ, Math.min(mapBounds.maxZ, worldCoords.z))),
    };
  };

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start dragging if clicking on a waypoint or on an offscreen indicator
    if ((e.target as HTMLElement).closest('[data-waypoint]') || 
        (e.target as HTMLElement).closest('.waypoint-marker') ||
        (e.target as HTMLElement).closest('.offscreen-indicator')) {
      return;
    }
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastMapCenter(mapCenter);
    e.preventDefault();
  };

  // Handle mouse move for dragging and hover coordinates
  const handleMouseMove = (e: React.MouseEvent) => {
    const container = mapContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update hover coordinates
    const coords = screenToWorldCoords(mouseX, mouseY);
    setHoverCoords(coords);

    // Handle dragging
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      // Convert screen movement to world coordinate movement
      const mapPixelDeltaX = -deltaX / zoomLevel;
      const mapPixelDeltaZ = -deltaY / zoomLevel;
      
      // Convert map pixel delta to world coordinate delta  
      const worldWidth = mapBounds.maxX - mapBounds.minX;
      const worldHeight = mapBounds.maxZ - mapBounds.minZ;

      const worldDeltaX = (mapPixelDeltaX / FIXED_MAP_SIZE_X) * worldWidth;
      const worldDeltaZ = (mapPixelDeltaZ / FIXED_MAP_SIZE_Z) * worldHeight;

      setMapCenter({
        x: lastMapCenter.x + worldDeltaX,
        z: lastMapCenter.z + worldDeltaZ
      });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to clear hover and stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverCoords(null);
  };

  // Calculate visible area - for now show full world
  const calculateVisibleDistance = () => {
    const worldWidth = mapBounds.maxX - mapBounds.minX;
    const worldHeight = mapBounds.maxZ - mapBounds.minZ;
    return Math.round(Math.max(worldWidth, worldHeight));
  };

  // Precompute positions for stops to avoid double-computation during render
  const stopPositions = useMemo(() => {
    return taxiStops.map(stop => ({ stop, pos: calculateStopPosition(stop) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxiStops, mapCenter, zoomLevel, mapBounds.minX, mapBounds.maxX, mapBounds.minZ, mapBounds.maxZ]);

  return (
    <div className="relative bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-secondary-600 to-secondary-800 rounded-t-xl">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Mapa Interactivo de Minecraft</h2>
            <p className="text-secondary-100">Arrastra para navegar • Rueda del ratón para zoom • Selecciona destinos para viajar</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-secondary-500/50 px-3 py-1 rounded-full">
              <FaCompass className="text-white mr-2" />
              <span className="text-white font-medium">
                Centro: X: {Math.round(mapCenter.x)}, Z: {Math.round(mapCenter.z)}
              </span>
            </div>
            {showCoordinates && (
              <div className="flex items-center bg-secondary-500/50 px-3 py-1 rounded-full">
                <span className="text-white font-medium text-sm">
                  Jugador: X: {playerPosition.x}, Z: {playerPosition.z}
                </span>
              </div>
            )}
            {hoverCoords && (
              <div className="flex items-center bg-yellow-500/90 px-3 py-1 rounded-full">
                <span className="text-black font-medium text-sm">
                  Cursor: X: {hoverCoords.x}, Z: {hoverCoords.z}
                </span>
              </div>
            )}
            <div className="flex items-center bg-secondary-500/50 px-3 py-1 rounded-full">
              <span className="text-white font-medium text-sm">
                Área: {mapBounds.minX},{mapBounds.minZ} → {mapBounds.maxX},{mapBounds.maxZ}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow relative bg-surface-50">
        {/* Map container with custom image background */}
        <div 
          className={`absolute inset-0 bg-[#041F4E] overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          ref={mapContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Fixed-size map container */}
          <div 
            className="absolute"
            style={{
              width: `${FIXED_MAP_SIZE_X * zoomLevel}px`,
              height: `${FIXED_MAP_SIZE_Z * zoomLevel}px`,
              // Center the map so that mapCenter appears at viewport center
              left: '50%',
              top: '50%',
              transform: (() => {
                const centerMapPos = worldToMapPixels(mapCenter.x, mapCenter.z);
                const offsetX = ( (FIXED_MAP_SIZE_X / 2 - centerMapPos.x) * zoomLevel );
                const offsetY = ( (FIXED_MAP_SIZE_Z / 2 - centerMapPos.z) * zoomLevel );
                return `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
              })(),
            }}
          >
            <img
              src="/smartrotom/img/TERASTEST4.webp"
              alt="Minecraft Map"
              className="w-full h-full object-cover"
            />

            {/* Taxi Stops - positioned relative to the map image (only those inside the viewport) */}
            {stopPositions.map(({ stop, pos }) => {
              if (!pos.isWithinView) return null;

              const mapPos = worldToMapPixels(stop.x, stop.z);
              const leftPercent = (mapPos.x / FIXED_MAP_SIZE_X) * 100;
              const topPercent = (mapPos.z / FIXED_MAP_SIZE_Z) * 100;

              return (
                <div
                  key={stop.id}
                  className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer waypoint-marker"
                  data-waypoint="true"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    centerMapOnStop(stop);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <FaMapMarkerAlt className={`text-3xl ${selectedStop?.id === stop.id ? 'text-yellow-400' : 'text-red-500'}`} />
                  <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 ${selectedStop?.id === stop.id ? 'bg-yellow-500' : 'bg-black/70'} text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium pointer-events-none`}>
                    {stop.id}
                  </div>
                </div>
              );
            })}

            {/* Player Position - positioned relative to the map image */}
            {(() => {
              const mapPos = worldToMapPixels(playerPosition.x, playerPosition.z);
              // Convert to percentage of the map size for consistent positioning regardless of zoom
              const leftPercent = (mapPos.x / FIXED_MAP_SIZE_X) * 100;
              const topPercent = (mapPos.z / FIXED_MAP_SIZE_Z) * 100;

              return (
                <div
                  className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                >
                  <div className="relative w-10 h-10">
                    <div className="absolute inset-0 bg-secondary-400 rounded-full animate-ping opacity-40"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-xs">TÚ</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Trajectory line for selected stops - positioned relative to the map image */}
            {selectedStop && (() => {
              const playerMapPos = worldToMapPixels(playerPosition.x, playerPosition.z);
              const stopMapPos = worldToMapPixels(selectedStop.x, selectedStop.z);
              
              // Convert to percentages for SVG coordinates
              const playerXPercent = (playerMapPos.x / FIXED_MAP_SIZE_X) * 100;
              const playerZPercent = (playerMapPos.z / FIXED_MAP_SIZE_Z) * 100;
              const stopXPercent = (stopMapPos.x / FIXED_MAP_SIZE_X) * 100;
              const stopZPercent = (stopMapPos.z / FIXED_MAP_SIZE_Z) * 100;

              return (
                <svg 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none z-5"
                  style={{ overflow: 'visible' }}
                >
                  <line 
                    x1={`${playerXPercent}%`}
                    y1={`${playerZPercent}%`}
                    x2={`${stopXPercent}%`}
                    y2={`${stopZPercent}%`}
                    stroke="#FBBF24"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.7"
                  />
                </svg>
              );
            })()}

          </div>

          {/* Off-screen indicators (rendered in the viewport, above the map) */}
          {stopPositions.map(({ stop, pos }) => {
            if (pos.isWithinView) return null;

            const distance = Math.round(Math.hypot(stop.x - playerPosition.x, stop.z - playerPosition.z));

            return (
              <div
                key={`off-${stop.id}`}
                className="offscreen-indicator absolute z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
                style={{ left: `${pos.edgeX}%`, top: `${pos.edgeZ}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  centerMapOnStop(stop);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title={`${stop.id} — ${distance} bloques`}
              >
                {/* Arrow circle (rotated toward the stop). Keep label unrotated. */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${selectedStop?.id === stop.id ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'}`}>
                  <FaArrowRight style={{ transform: `rotate(${pos.angle}deg)` }} />
                </div>

                <div className={`px-2 py-1 text-xs rounded-md whitespace-nowrap font-medium ${selectedStop?.id === stop.id ? 'bg-yellow-400 text-black' : 'bg-black/70 text-white'}`}>
                  {stop.id} · {distance}b
                </div>
              </div>
            );
          })}

          {/* Enhanced compass rose */}
          <div className="absolute top-4 left-4 opacity-50 z-40">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="29" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none" />
              <line x1="30" y1="5" x2="30" y2="55" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1="5" y1="30" x2="55" y2="30" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <text x="30" y="10" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">N</text>
              <text x="50" y="30" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">E</text>
              <text x="30" y="52" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">S</text>
              <text x="10" y="30" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">W</text>
            </svg>
          </div>

          {/* Simple Control Panel - zoom removed for now */}
          <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-white/20 z-40">
            {/* Show current area */}
            <div className="text-xs text-center text-white/80 mb-3 font-medium">
              Área total: ~{calculateVisibleDistance()} bloques
            </div>
            
            {/* Navigation hint */}
            <div className="text-xs text-center text-secondary-200 mb-3">
              <span className="bg-secondary-800/70 px-2 py-1 rounded-md">Arrastra para navegar</span>
            </div>
            
            {/* Reset view button */}
            {(mapCenter.x !== playerPosition.x || mapCenter.z !== playerPosition.z) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetMapCenter();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                className="w-full px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 rounded-md text-white text-xs"
                title="Center on player"
              >
                Centrar en TÚ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
