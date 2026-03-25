import type { Position } from '@/components/common/map/StandardizedMap';

interface MapControlPanelProps {
  calculateVisibleDistance: () => number;
  mapCenter: Position;
  playerPosition: Position;
  onResetCenter: () => void;
}

export const MapControlPanel = ({
  calculateVisibleDistance,
  mapCenter,
  playerPosition,
  onResetCenter
}: MapControlPanelProps) => {
  const showResetButton = mapCenter.x !== playerPosition.x || mapCenter.z !== playerPosition.z;

  return (
    <div className="absolute bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-white/20 z-40">
      <div className="text-xs text-center text-white/80 mb-3 font-medium">
        Área total: ~{calculateVisibleDistance()} bloques
      </div>
      
      <div className="text-xs text-center text-secondary-200 mb-3">
        <span className="bg-secondary-800/70 px-2 py-1 rounded-md">Arrastra para navegar</span>
      </div>
      
      {showResetButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onResetCenter();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className="w-full px-3 py-1.5 bg-secondary-600 hover:bg-secondary-700 rounded-md text-white text-xs"
          title="Center on player"
        >
          Centrar en TÚ
        </button>
      )}
    </div>
  );
};
