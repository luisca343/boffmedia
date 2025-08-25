import React, { useState, useMemo } from 'react';
import { TownData, Property, Amenity } from '../types';
import { MapPin } from 'lucide-react';
import { StandardizedMap, CoordinateTransformer, MAP_CONSTANTS } from '@/components/map';
import { PropertyMarker, AmenityMarker, BoundaryMarker } from './MapMarkers';

interface TownMapProps {
  townData: TownData;
  townName: string;
  selectedProperty: Property | null;
  onPropertySelect: (property: Property | null) => void;
}

interface MapPosition {
  x: number;
  z: number;
}

export function TownMap({ townData, townName, selectedProperty, onPropertySelect }: TownMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<MapPosition>({ x: 0, z: 0 });

  const { colorClaro, colorMedio, colorOscuro, coordenadas, parcelas, comodidades } = townData.textos;

  // Calculate town boundaries and center
  const townBounds = useMemo(() => {
    if (!coordenadas) {
      // Fallback to parcelas bounds if no coordenadas
      const validParcelas = parcelas.filter(p => p.coordenadas);
      if (validParcelas.length === 0) return null;
      
      const xs = validParcelas.map(p => p.coordenadas!.x);
      const zs = validParcelas.map(p => p.coordenadas!.z);
      
      return {
        minX: Math.min(...xs) - 50,
        maxX: Math.max(...xs) + 50,
        minZ: Math.min(...zs) - 50,
        maxZ: Math.max(...zs) + 50,
      };
    }
    
    return {
      minX: coordenadas.inicio.x,
      maxX: coordenadas.fin.x,
      minZ: coordenadas.inicio.z,
      maxZ: coordenadas.fin.z,
    };
  }, [coordenadas, parcelas]);

  const townCenter = useMemo(() => {
    if (!townBounds) return { x: 0, z: 0 };
    return {
      x: (townBounds.minX + townBounds.maxX) / 2,
      z: (townBounds.minZ + townBounds.maxZ) / 2,
    };
  }, [townBounds]);

  // Initialize map center
  React.useEffect(() => {
    setMapCenter(townCenter);
  }, [townCenter]);

  // Create transformer for coordinate conversion
  const transformer = useMemo(() => new CoordinateTransformer(MAP_CONSTANTS.WORLD_BOUNDS), []);

  if (!townBounds) {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <p className="text-gray-500">No hay coordenadas disponibles para mostrar el mapa</p>
      </div>
    );
  }

  const centerOnProperty = (property: Property) => {
    if (property.coordenadas) {
      setMapCenter({ x: property.coordenadas.x, z: property.coordenadas.z });
      onPropertySelect(property);
    }
  };

  return (
    <div className="relative">
      <StandardizedMap
        mapCenter={mapCenter}
        zoomLevel={zoomLevel}
        onMapCenterChange={setMapCenter}
        onZoomChange={setZoomLevel}
        className="h-96"
        minZoom={3}
        maxZoom={5}
      >
        {/* Town boundaries */}
        <BoundaryMarker
          bounds={townBounds}
          transformer={transformer}
          color={colorOscuro}
        />

        {/* Property markers */}
        {parcelas
          .filter(property => property.coordenadas)
          .map(property => (
            <PropertyMarker
              key={property.id}
              worldPosition={{ x: property.coordenadas!.x, z: property.coordenadas!.z }}
              transformer={transformer}
              property={property}
              isSelected={selectedProperty?.id === property.id}
              onClick={() => centerOnProperty(property)}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
            />
          ))}

        {/* Amenity markers */}
        {comodidades
          .filter(amenity => amenity.coordenadas)
          .map(amenity => (
            <AmenityMarker
              key={amenity.id}
              worldPosition={{ x: amenity.coordenadas!.x, z: amenity.coordenadas!.z }}
              transformer={transformer}
              amenity={amenity}
              colorOscuro={colorOscuro}
            />
          ))}
      </StandardizedMap>

      {/* Additional control to center on town */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => setMapCenter(townCenter)}
          className="w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform"
          style={{ color: colorMedio }}
          title="Centrar en el pueblo"
        >
          <MapPin className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
