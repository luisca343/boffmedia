import { FaMapMarkerAlt } from 'react-icons/fa';
import { TaxiStop } from "@boffmedia/shared";
import { BaseMarker } from '@/components/common/map/BaseMarker';
import { StopPosition, CoordinateTransformer } from '@/components/common/map/StandardizedMap';

interface TaxiStopMarkerProps {
  stop: TaxiStop;
  pos: StopPosition;
  selectedStop: TaxiStop | null;
  onStopClick: (stop: TaxiStop) => void;
  transformer: CoordinateTransformer;
}

export const TaxiStopMarker = ({ 
  stop, 
  pos, 
  selectedStop, 
  onStopClick, 
  transformer 
}: TaxiStopMarkerProps) => {
  if (!pos.isWithinView) return null;

  return (
    <BaseMarker
      worldPosition={{ x: stop.x, z: stop.z - 16 }} // Adjusted for marker position
      transformer={transformer}
      onClick={() => onStopClick(stop)}
      className="z-10 waypoint-marker"
      style={{ 'data-waypoint': 'true' } as React.CSSProperties}
    >
      <FaMapMarkerAlt 
        className={`text-3xl ${
          selectedStop?.id === stop.id ? 'text-yellow-400' : 'text-red-500'
        }`} 
      />
      <div 
        className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-1 ${
          selectedStop?.id === stop.id ? 'bg-yellow-500' : 'bg-black/70'
        } text-white text-xs px-2 py-1 rounded-md whitespace-nowrap font-medium pointer-events-none`}
      >
        {stop.id}
      </div>
    </BaseMarker>
  );
};
