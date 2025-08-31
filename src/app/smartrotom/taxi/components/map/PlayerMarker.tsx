import { BaseMarker } from '@/components/common/map/BaseMarker';
import type { Position, CoordinateTransformer } from '@/components/common/map/StandardizedMap';

interface PlayerMarkerProps {
  playerPosition: Position;
  transformer: CoordinateTransformer;
}

export const PlayerMarker = ({ playerPosition, transformer }: PlayerMarkerProps) => {
  return (
    <BaseMarker
      worldPosition={playerPosition}
      transformer={transformer}
      className="z-30"
    >
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 bg-secondary-400 rounded-full animate-ping opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-500 to-secondary-700 rounded-full border-2 border-white flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-xs">TÚ</span>
        </div>
      </div>
    </BaseMarker>
  );
};
