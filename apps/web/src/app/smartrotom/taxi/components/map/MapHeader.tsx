import { FaCompass } from 'react-icons/fa';
import type { Position } from '@/components/shared/map/StandardizedMap';

interface MapHeaderProps {
  mapCenter: Position;
  playerPosition: Position;
  hoverCoords: Position | null;
  mapBounds: any;
  showCoordinates?: boolean;
}

export const MapHeader = ({
  mapCenter,
  playerPosition,
  hoverCoords,
  mapBounds,
  showCoordinates = false
}: MapHeaderProps) => {
  return (
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
  );
};
