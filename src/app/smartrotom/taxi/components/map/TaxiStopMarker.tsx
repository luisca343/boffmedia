import { FaMapMarkerAlt } from 'react-icons/fa';
import { TaxiStop } from "@/types/dto/taxi-stop.dto";
import { StopPosition } from '../../types/map.types';
import { CoordinateTransformer } from '../../utils/coordinate-utils';
import { MAP_CONSTANTS } from '../../utils/constants';

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

  const mapPos = transformer.worldToMapPixels(stop.x, stop.z);
  const leftPercent = (mapPos.x / MAP_CONSTANTS.FIXED_MAP_SIZE_X) * 100;
  const topPercent = (mapPos.z / MAP_CONSTANTS.FIXED_MAP_SIZE_Z) * 100;

  return (
    <div
      className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer waypoint-marker"
      data-waypoint="true"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onStopClick(stop);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
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
    </div>
  );
};
