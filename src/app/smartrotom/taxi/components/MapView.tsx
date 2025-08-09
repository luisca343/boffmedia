import { FaMapMarkerAlt, FaArrowRight, FaCompass } from 'react-icons/fa'
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { useState, useRef, useEffect } from 'react'

interface Position {
  x: number;
  z: number;
}

interface MapViewProps {
  taxiStops: TaxiStop[];
  playerPosition: Position;
  selectedStop: TaxiStop | null;
  setSelectedStop: (stop: TaxiStop) => void;
}

export default function MapView({ taxiStops, playerPosition, selectedStop, setSelectedStop }: MapViewProps) {
  // Initial zoom level set to medium (50), with range now from 5 (very zoomed in) to 500 (shows 10000+ blocks)
  const [zoomLevel, setZoomLevel] = useState(50);
  const [mapCenter, setMapCenter] = useState<Position>(playerPosition);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Update map center when a stop is selected
  useEffect(() => {
    if (selectedStop) {
      setMapCenter({ x: selectedStop.x, z: selectedStop.z });
    } else {
      setMapCenter(playerPosition);
    }
  }, [selectedStop, playerPosition]);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Calculate zoom factor - smaller value for smoother zooming
    const zoomFactor = 1.1;
    
    // Determine zoom direction and calculate new zoom value
    const newZoom = e.deltaY > 0 
      ? Math.min(500, zoomLevel * zoomFactor) // Zoom out (increase value)
      : Math.max(5, zoomLevel / zoomFactor);  // Zoom in (decrease value)
    
    setZoomLevel(newZoom);
  };

  // Calculate if a stop is within viewport and get its position
  const calculateStopPosition = (stop: TaxiStop | Position & { id: string }) => {
    // Calculate relative position based on map center and zoom
    const relativeX = (stop.x - mapCenter.x) / zoomLevel;
    const relativeZ = (stop.z - mapCenter.z) / zoomLevel;
    
    // Define the map boundaries (percent from center)
    const boundary = 45; // 45% from center in each direction
    
    // Check if the stop is within the visible area
    const isWithinXBounds = Math.abs(relativeX) <= boundary;
    const isWithinZBounds = Math.abs(relativeZ) <= boundary;
    const isWithinView = isWithinXBounds && isWithinZBounds;
    
    // Calculate position for edge indicators
    let edgeX = relativeX;
    let edgeZ = relativeZ;
    
    // If outside viewport, calculate edge position
    if (!isWithinView) {
      // Normalize the direction vector to find edge intersection
      if (Math.abs(relativeX) > Math.abs(relativeZ)) {
        // Hits horizontal edge
        edgeX = Math.sign(relativeX) * boundary;
        edgeZ = relativeZ * (boundary / Math.abs(relativeX));
      } else {
        // Hits vertical edge
        edgeZ = Math.sign(relativeZ) * boundary;
        edgeX = relativeX * (boundary / Math.abs(relativeZ));
      }
    }
    
    // Calculate angle for edge indicators
    const angle = Math.atan2(relativeZ, relativeX) * (180 / Math.PI);
    
    return {
      actualX: 50 + relativeX,
      actualZ: 50 + relativeZ,
      edgeX: 50 + edgeX,
      edgeZ: 50 + edgeZ,
      isWithinView,
      angle,
    };
  };

  // Function to center the map on a specific stop
  const centerMapOnStop = (stop: TaxiStop) => {
    setMapCenter({ x: stop.x, z: stop.z });
    setSelectedStop(stop);
  };

  // Reset map center to player position
  const resetMapCenter = () => {
    setMapCenter(playerPosition);
    if (selectedStop) {
      setSelectedStop(selectedStop); // Keep the selection, just recenter
    }
  };

  // Calculate visible area based on current zoom level
  const calculateVisibleDistance = () => {
    return Math.round(zoomLevel * 45 * 2); // boundary is 45% from center in each direction, so 90% total width
  };

  // Custom zoom control with presets and finer adjustments
  const handleZoomChange = (newZoom: number) => {
    // Clamp zoom between 5 (very zoomed in) and 500 (shows 10000+ blocks)
    setZoomLevel(Math.max(5, Math.min(500, newZoom)));
  };

  // Zoom preset levels
  const zoomPresets = [
    { label: "Ciudad", value: 20 },       // City view (~900 blocks)
    { label: "Región", value: 100 },      // Region view (~4500 blocks)
    { label: "Mundo", value: 250 },       // World view (~11250 blocks)
  ];

  return (
    <div className="relative bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-secondary-600 to-secondary-800 rounded-t-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Mapa de Destinos</h2>
            <p className="text-secondary-100">Selecciona un destino en el mapa para viajar</p>
          </div>
          <div className="flex items-center bg-secondary-500/50 px-3 py-1 rounded-full">
            <FaCompass className="text-white mr-2" />
            <span className="text-white font-medium">
              X: {mapCenter.x}, Z: {mapCenter.z}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow relative bg-surface-50">
        {/* Map container with enhanced styling */}
        <div 
          className="absolute inset-0 bg-[#041F4E] overflow-hidden"
          ref={mapContainerRef}
          onWheel={handleWheel}
        >
          {/* Map Grid Lines with improved visibility */}
          <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: `${100 / Math.sqrt(zoomLevel) * 5}px ${100 / Math.sqrt(zoomLevel) * 5}px`,
          backgroundPosition: '50% 50%'
        }}></div>
          
          {/* Enhanced compass rose */}
          <div className="absolute top-4 left-4 opacity-50">
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
          
          {/* Player Position Indicator with pulsing effect */}
          <div 
            className="absolute w-10 h-10 transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ 
              left: `${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualX}%`, 
              top: `${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualZ}%`
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-secondary-400 rounded-full animate-ping opacity-40"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">TÚ</span>
              </div>
            </div>
          </div>

          {/* Taxi Stop Markers */}
          {taxiStops.map((stop) => {
            const position = calculateStopPosition(stop);
            const isSelected = selectedStop?.id === stop.id;
            
            return (
              <div key={stop.id}>
                {/* Stop marker (either in view or at edge) */}
                <div 
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 ${isSelected ? 'z-20' : 'z-10'}`}
                  style={{ 
                    left: `${position.isWithinView ? position.actualX : position.edgeX}%`, 
                    top: `${position.isWithinView ? position.actualZ : position.edgeZ}%`,
                    filter: isSelected ? 'drop-shadow(0 0 8px rgba(219, 234, 254, 0.8))' : 'none'
                  }}
                  onClick={() => centerMapOnStop(stop)}
                >
                  {position.isWithinView ? (
                    // Standard marker for stops within view
                    <>
                      <FaMapMarkerAlt className={`text-3xl ${isSelected ? 'text-yellow-400' : 'text-red-500'}`} />
                      <div className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 ${isSelected ? 'bg-yellow-500' : 'bg-black/70'} text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium`}>
                        {stop.id}
                      </div>
                    </>
                  ) : (
                    // Edge indicator for stops outside view
                    <div className="relative">
                      <div 
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isSelected ? 'bg-yellow-400' : 'bg-red-500'
                        } border-2 border-white shadow-md`}
                        title={stop.id}
                      >
                        <div 
                          className="w-4 h-4"
                          style={{ transform: `rotate(${position.angle}deg)` }}
                        >
                          <FaArrowRight className="text-white" />
                        </div>
                      </div>
                      
                      {/* Smart positioning for labels based on edge position */}
                      {(() => {
                        // Determine label position based on marker location
                        let labelClasses = `absolute ${isSelected ? 'bg-yellow-500' : 'bg-black/70'} text-white text-xs px-2 py-1 rounded-md whitespace-nowrap`;
                        let labelStyle = {};
                        
                        // Bottom edge
                        if (position.edgeZ > 85) {
                          labelClasses += " -top-8 left-1/2 transform -translate-x-1/2";
                        }
                        // Top edge
                        else if (position.edgeZ < 15) {
                          labelClasses += " top-full mt-1 left-1/2 transform -translate-x-1/2";
                        }
                        // Right edge
                        else if (position.edgeX > 85) {
                          labelClasses += " top-1/2 right-full mr-2 transform -translate-y-1/2";
                        }
                        // Left edge
                        else if (position.edgeX < 15) {
                          labelClasses += " top-1/2 left-full ml-2 transform -translate-y-1/2";
                        }
                        // Default (below)
                        else {
                          labelClasses += " top-full mt-1 left-1/2 transform -translate-x-1/2";
                        }
                        
                        return (
                          <div className={labelClasses} style={labelStyle}>
                            {stop.id}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Trajectory line for selected stops - enhanced */}
                {isSelected && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
                    <svg className="w-full h-full">
                      <line 
                        x1={`${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualX}%`}
                        y1={`${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualZ}%`}
                        x2={`${position.isWithinView ? position.actualX : position.edgeX}%`}
                        y2={`${position.isWithinView ? position.actualZ : position.edgeZ}%`}
                        stroke="#FBBF24"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Enhanced Control Panel */}
          <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-white/20">
            {/* Visible distance indicator */}
            <div className="text-xs text-center text-white/80 mb-3 font-medium">
              Rango visible: ~{calculateVisibleDistance()} bloques
            </div>
            
            {/* Zoom slider */}
            <div className="mb-3">
              <input
                type="range"
                min="5"
                max="250"
                value={zoomLevel}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                className="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Zoom preset buttons */}
            <div className="flex justify-between gap-1 mb-3">
              {zoomPresets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleZoomChange(preset.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    Math.abs(zoomLevel - preset.value) < 10
                      ? 'bg-yellow-500 text-[#041F4E]'
                      : 'bg-secondary-700 text-white hover:bg-secondary-600'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Fine-tune zoom controls */}
            <div className="flex mb-3">
              <button 
                onClick={() => handleZoomChange(zoomLevel - 10)}
                className="px-3 py-1 bg-secondary-600 hover:bg-secondary-700 text-white rounded-l-md mr-px"
                title="Zoom in more"
              >
                ++
              </button>
              <button 
                onClick={() => handleZoomChange(zoomLevel - 5)}
                className="px-3 py-1 bg-secondary-600 hover:bg-secondary-700 text-white mr-px"
                title="Zoom in"
              >
                +
              </button>
              <button 
                onClick={() => handleZoomChange(zoomLevel + 5)}
                className="px-3 py-1 bg-secondary-600 hover:bg-secondary-700 text-white mr-px"
                title="Zoom out"
              >
                -
              </button>
              <button 
                onClick={() => handleZoomChange(zoomLevel + 10)}
                className="px-3 py-1 bg-secondary-600 hover:bg-secondary-700 text-white rounded-r-md"
                title="Zoom out more"
              >
                --
              </button>
            </div>
            
            {/* Scroll wheel hint */}
            <div className="text-xs text-center text-secondary-200 mb-3">
              <span className="bg-secondary-800/70 px-2 py-1 rounded-md">Usa la rueda del ratón para hacer zoom</span>
            </div>
            
            {/* Reset view button */}
            {(mapCenter.x !== playerPosition.x || mapCenter.z !== playerPosition.z) && (
              <button
                onClick={resetMapCenter}
                className="w-full px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 rounded-md text-white text-xs"
                title="Center on player"
              >
                Centrar en TÚ
              </button>
            )}

            {/* Max zoom button - only shows when not at max */}
            {zoomLevel < 250 && (
              <button
                onClick={() => handleZoomChange(250)}
                className="w-full mt-1 px-3 py-1.5 bg-secondary-800 hover:bg-secondary-700 rounded-md text-secondary-200 text-xs"
                title="Maximum zoom out"
              >
                Ver mundo completo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}