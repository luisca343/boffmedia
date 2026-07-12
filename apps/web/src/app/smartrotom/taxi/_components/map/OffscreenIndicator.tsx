import { FaArrowRight } from 'react-icons/fa';
import { TaxiStop } from "@boffmedia/shared";
import type { StopPosition, Position } from '@/components/shared/map/StandardizedMap';

// Helper function to calculate distance between two points
const calculateDistance = (stop: TaxiStop, playerPosition: Position): number => {
  return Math.round(Math.sqrt(Math.pow(stop.x - playerPosition.x, 2) + Math.pow(stop.z - playerPosition.z, 2)));
};

interface OffscreenIndicatorProps {
  stop: TaxiStop;
  pos: StopPosition;
  selectedStop: TaxiStop | null;
  playerPosition: Position;
  onStopClick: (stop: TaxiStop) => void;
}

export const OffscreenIndicator = ({ 
  stop, 
  pos, 
  selectedStop, 
  playerPosition, 
  onStopClick 
}: OffscreenIndicatorProps) => {
  if (pos.isWithinView) return null;

  const distance = calculateDistance(stop, playerPosition);

  return (
    <div
      className="offscreen-indicator absolute z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2"
      style={{ left: `${pos.edgeX}%`, top: `${pos.edgeZ}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onStopClick(stop);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title={`${stop.id} — ${distance} bloques`}
    >
      <div 
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          selectedStop?.id === stop.id ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'
        }`}
      >
        <FaArrowRight style={{ transform: `rotate(${pos.angle}deg)` }} />
      </div>

      <div 
        className={`px-2 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
          selectedStop?.id === stop.id ? 'bg-yellow-400 text-black' : 'bg-black/70 text-white'
        }`}
      >
        {stop.id} · {distance}b
      </div>
    </div>
  );
};
