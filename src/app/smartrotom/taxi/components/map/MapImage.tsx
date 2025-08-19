import { Position } from '../../types/map.types';
import { CoordinateTransformer } from '../../utils/coordinate-utils';
import { MAP_CONSTANTS } from '../../utils/constants';

interface MapImageProps {
  zoomLevel: number;
  mapCenter: Position;
  transformer: CoordinateTransformer;
  children: React.ReactNode;
}

export const MapImage = ({ zoomLevel, mapCenter, transformer, children }: MapImageProps) => {
  const centerMapPos = transformer.worldToMapPixels(mapCenter.x, mapCenter.z);
  const offsetX = ((MAP_CONSTANTS.FIXED_MAP_SIZE_X / 2 - centerMapPos.x) * zoomLevel);
  const offsetY = ((MAP_CONSTANTS.FIXED_MAP_SIZE_Z / 2 - centerMapPos.z) * zoomLevel);

  return (
    <div 
      className="absolute"
      style={{
        width: `${MAP_CONSTANTS.FIXED_MAP_SIZE_X * zoomLevel}px`,
        height: `${MAP_CONSTANTS.FIXED_MAP_SIZE_Z * zoomLevel}px`,
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
      }}
    >
      <img
        src="/smartrotom/img/TERASTEST4.webp"
        alt="Minecraft Map"
        className="w-full h-full object-cover"
      />
      {children}
    </div>
  );
};
