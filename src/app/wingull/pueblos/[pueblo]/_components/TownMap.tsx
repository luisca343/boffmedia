import React, { useState, useMemo } from 'react';
import { TownData, Property, Amenity, SelectedMarker } from '../types';
import { MapPin } from 'lucide-react';
import { StandardizedMap, CoordinateTransformer, MAP_CONSTANTS } from '@/components/map';
import { PropertyMarker, AmenityMarker, BoundaryMarker, BusinessMarker } from './MapMarkers';

interface TownMapProps {
  townData: TownData;
  townName: string;
  selectedMarker: SelectedMarker | null;
  onMarkerSelect: (marker: SelectedMarker | null) => void;
}

interface MapPosition {
  x: number;
  z: number;
}

export function TownMap({ townData, townName, selectedMarker, onMarkerSelect }: TownMapProps) {
  const [zoomLevel, setZoomLevel] = useState(6);
  const [mapCenter, setMapCenter] = useState<MapPosition>({ x: 0, z: 0 });

  const { colorClaro, colorMedio, colorOscuro, coordenadas, parcelas, comodidades, negocios } = townData.textos;

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
      onMarkerSelect({ type: 'property', data: property });
    }
  };

  const centerOnBusiness = (business: Property) => {
    if (business.coordenadas) {
      setMapCenter({ x: business.coordenadas.x, z: business.coordenadas.z });
      onMarkerSelect({ type: 'business', data: business });
    }
  };

  const centerOnAmenity = (amenity: Amenity) => {
    if (amenity.coordenadas) {
      setMapCenter({ x: amenity.coordenadas.x, z: amenity.coordenadas.z });
      onMarkerSelect({ type: 'amenity', data: amenity });
    }
  };

  // Helper function to check if a marker is selected
  const isPropertySelected = (propertyId: number) => 
    selectedMarker?.type === 'property' && (selectedMarker.data as Property).id === propertyId;
  
  const isBusinessSelected = (businessId: number) => 
    selectedMarker?.type === 'business' && (selectedMarker.data as Property).id === businessId;
  
  const isAmenitySelected = (amenityId: string) => 
    selectedMarker?.type === 'amenity' && (selectedMarker.data as Amenity).id === amenityId;

  return (
    <div className="relative">
      <StandardizedMap
        mapCenter={mapCenter}
        zoomLevel={zoomLevel}
        onMapCenterChange={setMapCenter}
        onZoomChange={setZoomLevel}
        className="h-128"
        minZoom={5}
        maxZoom={12}
        
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
              isSelected={isPropertySelected(property.id)}
              onClick={() => centerOnProperty(property)}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
            />
          ))}

        {/* Business markers */}
        {negocios
          .filter(business => business.coordenadas)
          .map(business => (
            <BusinessMarker
              key={`business-${business.id}`}
              worldPosition={{ x: business.coordenadas!.x, z: business.coordenadas!.z }}
              transformer={transformer}
              business={business}
              isSelected={isBusinessSelected(business.id)}
              onClick={() => centerOnBusiness(business)}
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
              isSelected={isAmenitySelected(amenity.id)}
              onClick={() => centerOnAmenity(amenity)}
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
