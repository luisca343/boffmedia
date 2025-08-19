import { Position } from '../../types/map.types';
import { CoordinateTransformer } from '../../utils/coordinate-utils';
import { MAP_CONSTANTS } from '../../utils/constants';

interface PlayerMarkerProps {
  playerPosition: Position;
  transformer: CoordinateTransformer;
}

export const PlayerMarker = ({ playerPosition, transformer }: PlayerMarkerProps) => {
  const mapPos = transformer.worldToMapPixels(playerPosition.x, playerPosition.z);
  const leftPercent = (mapPos.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const topPercent = (mapPos.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;

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
};
