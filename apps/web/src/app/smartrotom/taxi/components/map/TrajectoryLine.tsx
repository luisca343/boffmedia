import { TaxiStop } from "@boffmedia/shared";
import { MAP_CONSTANTS } from '@/components/common/map/StandardizedMap';
import type { Position, CoordinateTransformer } from '@/components/common/map/StandardizedMap';

interface TrajectoryLineProps {
  selectedStop: TaxiStop | null;
  playerPosition: Position;
  transformer: CoordinateTransformer;
}

export const TrajectoryLine = ({ 
  selectedStop, 
  playerPosition, 
  transformer 
}: TrajectoryLineProps) => {
  if (!selectedStop) return null;

  const playerMapPos = transformer.worldToMapPixels(playerPosition.x, playerPosition.z);
  const stopMapPos = transformer.worldToMapPixels(selectedStop.x, selectedStop.z);
  
  const playerXPercent = (playerMapPos.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const playerZPercent = (playerMapPos.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;
  const stopXPercent = (stopMapPos.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const stopZPercent = (stopMapPos.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;

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
        strokeWidth="5"
        strokeDasharray="10, 5"
        opacity="0.7"
      />
    </svg>
  );
};
