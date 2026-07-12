import { TaxiStop } from "@boffmedia/shared";
import { TaxiStopExtended } from "@/types";
import { useMemo } from 'react';

// Types and Utils
import { Position, MapBounds, CoordinateTransformer, PositionCalculator, MapImage } from '@/components/shared/map/StandardizedMap';

// Hooks
import { useMapState } from '../_hooks/useMapState';
import { useMapInteractions } from '../_hooks/useMapInteractions';
import { useStopPositions } from '../_hooks/useStopPositions';
import { useViewportDimensions } from '../_hooks/useViewportDimensions';

// Components
import { MapHeader } from './map/MapHeader';
import { PlayerMarker } from './map/PlayerMarker';
import { TaxiStopMarker } from './map/TaxiStopMarker';
import { OffscreenIndicator } from './map/OffscreenIndicator';
import { TrajectoryLine } from './map/TrajectoryLine';
import { CompassRose } from './map/CompassRose';
import { MapControlPanel } from './map/MapControlPanel';

interface MapViewProps {
  taxiStops: TaxiStopExtended[];
  playerPosition: Position;
  selectedStop: TaxiStopExtended | null;
  setSelectedStop: (stop: TaxiStopExtended) => void;
  mapBounds?: MapBounds;
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
  // Map state management
  const {
    zoomLevel,
    mapCenter,
    mapBounds,
    handleZoom,
    centerMapOnPosition,
    resetMapCenter,
    calculateVisibleDistance,
    setMapCenter
  } = useMapState({ playerPosition, customMapBounds });

  // Create utility instances
  const transformer = useMemo(() => new CoordinateTransformer(mapBounds), [mapBounds]);
  const positionCalculator = useMemo(() => new PositionCalculator(transformer), [transformer]);

  // Map interactions
  const {
    dragState,
    hoverCoords,
    mapContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  } = useMapInteractions({
    mapBounds,
    zoomLevel,
    mapCenter,
    setMapCenter,
    transformer
  });

  // Viewport dimensions
  const viewportDimensions = useViewportDimensions(mapContainerRef);

  // Stop positions calculation
  const stopPositions = useStopPositions({
    taxiStops,
    mapCenter,
    zoomLevel,
    mapBounds,
    positionCalculator,
    viewportWidth: viewportDimensions.width,
    viewportHeight: viewportDimensions.height
  });

  // Event handlers
  const handleWheel = (e: React.WheelEvent) => {
    handleZoom(e.deltaY);
  };

  const handleStopClick = (stop: TaxiStop) => {
    centerMapOnPosition(intermediatePoint(playerPosition, stop));
    setSelectedStop(stop);
  };

  const intermediatePoint = (start: Position, end: Position) => {
    
    return {
      x: (start.x + end.x) / 2,
      z: (start.z + end.z) / 2
    };
  };

  return (
    <div className="relative bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <MapHeader
        mapCenter={mapCenter}
        playerPosition={playerPosition}
        hoverCoords={hoverCoords}
        mapBounds={mapBounds}
        showCoordinates={showCoordinates}
      />
      
      <div className="flex-grow relative bg-base">
        <div 
          className={`absolute inset-0 bg-[#041F4E] overflow-hidden ${
            dragState.isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          ref={mapContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <MapImage
            zoomLevel={zoomLevel}
            mapCenter={mapCenter}
            transformer={transformer}
          >
            {/* Taxi Stop Markers */}
            {stopPositions.map(({ stop, pos }) => (
              <TaxiStopMarker
                key={stop.id}
                stop={stop}
                pos={pos}
                selectedStop={selectedStop}
                onStopClick={handleStopClick}
                transformer={transformer}
              />
            ))}

            {/* Player Marker */}
            <PlayerMarker
              playerPosition={playerPosition}
              transformer={transformer}
            />

            {/* Trajectory Line */}
            <TrajectoryLine
              selectedStop={selectedStop}
              playerPosition={playerPosition}
              transformer={transformer}
            />
          </MapImage>

          {/* Off-screen Indicators */}
          {stopPositions.map(({ stop, pos }) => (
            <OffscreenIndicator
              key={`off-${stop.id}`}
              stop={stop}
              pos={pos}
              selectedStop={selectedStop}
              playerPosition={playerPosition}
              onStopClick={handleStopClick}
            />
          ))}

          <CompassRose />

          <MapControlPanel
            calculateVisibleDistance={calculateVisibleDistance}
            mapCenter={mapCenter}
            playerPosition={playerPosition}
            onResetCenter={resetMapCenter}
          />
        </div>
      </div>
    </div>
  );
}
