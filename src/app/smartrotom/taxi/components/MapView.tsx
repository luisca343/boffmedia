import { FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa'
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
  const [zoomLevel, setZoomLevel] = useState(10);
  const [mapCenter, setMapCenter] = useState<Position>(playerPosition);
  
  // Update map center when a stop is selected
  useEffect(() => {
    if (selectedStop) {
      setMapCenter({ x: selectedStop.x, z: selectedStop.z });
    } else {
      setMapCenter(playerPosition);
    }
  }, [selectedStop, playerPosition]);

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

  return (
    <div className="relative bg-yellow-100 rounded-xl shadow-lg h-full flex flex-col">
      <div className="p-4 bg-yellow-200 rounded-t-xl">
        <h2 className="text-xl font-semibold text-yellow-800 mb-2">Mapa de Destinos</h2>
        <p className="text-yellow-700">Selecciona un destino en el mapa para viajar</p>
      </div>
      <div className="flex-grow relative bg-yellow-50 p-4">
        {/* Simulated Map View */}
        <div className="absolute inset-0 bg-[#2C8C99] overflow-hidden">
          {/* Map Grid Lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Player Position Indicator */}
          <div 
            className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{ 
              left: `${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualX}%`, 
              top: `${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualZ}%`
            }}
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-40"></div>
              <div className="absolute inset-0 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
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
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 ${isSelected ? 'z-20' : 'z-10'}`}
                  style={{ 
                    left: `${position.isWithinView ? position.actualX : position.edgeX}%`, 
                    top: `${position.isWithinView ? position.actualZ : position.edgeZ}%`,
                    filter: isSelected ? 'drop-shadow(0 0 8px yellow)' : 'none'
                  }}
                  onClick={() => centerMapOnStop(stop)}
                >
                  {position.isWithinView ? (
                    // Standard marker for stops within view
                    <>
                      <FaMapMarkerAlt className={`text-3xl ${isSelected ? 'text-yellow-400' : 'text-red-500'}`} />
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-black/70 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                        {stop.id}
                      </div>
                    </>
                  ) : (
                    // Edge indicator for stops outside view
                    <div className="relative">
                    <div 
                        className={`flex items-center justify-center w-8 h-8 rounded-full ${isSelected ? 'bg-yellow-400' : 'bg-red-500'} border-2 border-white`}
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
                        let labelClasses = "absolute bg-black/70 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap";
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
                
                {/* Trajectory line for selected stops */}
                {isSelected && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-5">
                    <svg className="w-full h-full">
                      <line 
                        x1={`${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualX}%`}
                        y1={`${calculateStopPosition({ id: 'player', x: playerPosition.x, z: playerPosition.z }).actualZ}%`}
                        x2={`${position.isWithinView ? position.actualX : position.edgeX}%`}
                        y2={`${position.isWithinView ? position.actualZ : position.edgeZ}%`}
                        stroke="#FFD700"
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

          {/* Control panel */}
          <div className="absolute bottom-4 right-4 bg-white/80 rounded shadow-md p-2 flex flex-col space-y-2">
            {/* Zoom controls */}
            <div className="flex">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 2, 4))}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-800 mr-2"
                title="Zoom in"
              >
                +
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 2, 20))}
                className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-yellow-800"
                title="Zoom out"
              >
                -
              </button>
            </div>
            
            {/* Reset view button */}
            {(mapCenter.x !== playerPosition.x || mapCenter.z !== playerPosition.z) && (
              <button
                onClick={resetMapCenter}
                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800 text-xs"
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