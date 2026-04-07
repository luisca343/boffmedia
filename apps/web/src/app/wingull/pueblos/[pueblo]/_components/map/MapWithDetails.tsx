import { useState } from 'react';
import { TownData, SelectedMarker } from '../../types';
import { MapContainer } from './MapContainer';
import { TownMap } from './TownMap';
import { MarkerDetailsPanel } from './MarkerDetailsPanel';

interface MapWithDetailsProps {
  townData: TownData;
  townName: string;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function MapWithDetails({ 
  townData, 
  townName, 
  colorClaro, 
  colorMedio, 
  colorOscuro 
}: MapWithDetailsProps) {
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <MapContainer 
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
    >
      <TownMap
        townData={townData}
        townName={townName}
        selectedMarker={selectedMarker}
        onMarkerSelect={setSelectedMarker}
      />

      {selectedMarker && (
        <MarkerDetailsPanel 
          selectedMarker={selectedMarker}
          selectedImageIndex={selectedImageIndex}
          onImageSelect={setSelectedImageIndex}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
          townData={townData}
        />
      )}
    </MapContainer>
  );
}
