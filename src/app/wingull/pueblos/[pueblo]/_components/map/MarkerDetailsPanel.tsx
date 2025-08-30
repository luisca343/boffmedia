import React from "react";
import { SelectedMarker, TownData, Property, Amenity } from "../../types";
import { ImageShowcase } from "../shared/image/ImageShowcase";
import { getIconComponent } from "../../utils";
import { MapPin, Home, Building2, Sparkles } from 'lucide-react';
import { BasicCard } from "../shared/cards/BasicCard";
import { GradientBar } from "../shared/decorative/GradientBar";
import { DecorativeCorner } from "../shared/decorative/DecorativeCorner";

interface MarkerDetailsPanelProps {
  selectedMarker: SelectedMarker;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  townData: TownData;
}

export function MarkerDetailsPanel({ 
  selectedMarker, 
  selectedImageIndex, 
  onImageSelect, 
  colorClaro, 
  colorMedio, 
  colorOscuro,
  townData 
}: MarkerDetailsPanelProps) {
  const { type, data } = selectedMarker;
  
  // Get the appropriate icon based on marker type
  const getMarkerIcon = () => {
    switch (type) {
      case 'property':
        return <Home className="w-5 h-5" style={{ color: colorClaro }} />;
      case 'business':
        return <Building2 className="w-5 h-5" style={{ color: colorClaro }} />;
      case 'amenity':
        const IconComponent = getIconComponent((data as Amenity).icon);
        return IconComponent ? <IconComponent className="w-5 h-5" style={{ color: colorClaro }} /> : <Sparkles className="w-5 h-5" style={{ color: colorClaro }} />;
      default:
        return <MapPin className="w-5 h-5" style={{ color: colorClaro }} />;
    }
  };

  // Get images for the selected marker
  const getMarkerImages = () => {
    if (type === 'amenity') {
      const amenity = data as Amenity;
      return amenity.images?.map(img => 
        require('path').join('/smartrotom/data/pueblos', img)
      ) || [];
    } else {
      const property = data as Property;
      const propertyType = type === 'business' ? 'negocio' : 'parcela';
      return townData.images?.filter(img => 
        img.includes(`${propertyType}${property.id}`)
      ) || [];
    }
  };

  const markerImages = getMarkerImages();

  return (
    <BasicCard 
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      className="mt-8 overflow-hidden">
      <div 
        className="relative backdrop-blur-sm rounded-2xl border-2 p-6 lg:p-8 shadow-xl overflow-hidden"
        style={{ 
          borderColor: colorOscuro, 
          backgroundColor: `rgba(255,255,255, 0.1)`,
          backdropFilter: 'blur(10px)'
        }}
      >

        <GradientBar 
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />
        
        <DecorativeCorner color={colorOscuro} position="top-left" />
        <DecorativeCorner color={colorOscuro} position="top-right" />
        <DecorativeCorner color={colorOscuro} position="bottom-left" />
        <DecorativeCorner color={colorOscuro} position="bottom-right" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image section */}
          {markerImages.length > 0 && (
            <div className="order-1 lg:order-1 group">
              <ImageShowcase
                images={markerImages}
                selectedImageIndex={selectedImageIndex}
                onImageSelect={onImageSelect}
                alt={data.name}
                colorClaro={colorClaro}
                colorMedio={colorMedio}
                colorOscuro={colorOscuro}
                className="h-64 lg:h-80"
                showNavigation={markerImages.length > 1}
              />
            </div>
          )}

          {/* Placeholder when no images are available */}
          {markerImages.length === 0 && (
            <div className="order-1 lg:order-1">
              <div 
                className="h-64 lg:h-80 rounded-xl border-2 border-dashed flex items-center justify-center"
                style={{ borderColor: `${colorClaro}40` }}
              >
                <div className="text-center space-y-3">
                  {getMarkerIcon()}
                  <p className="text-sm" style={{ color: colorMedio }}>
                    Sin imágenes disponibles
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content section */}
          <div className={`order-2 lg:order-2 ${markerImages.length === 0 ? '' : ''}`}>
            <div className="space-y-6 pt-4">
              {/* Title */}
              <div>
                <h4 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: colorOscuro }}>
                  {type === 'property' || type === 'business' ? `#${(data as Property).id} - ${data.name}` : data.name}
                </h4>
                <p className="text-lg leading-relaxed" style={{ color: colorOscuro, background: 'rgba(255,255,255,0.5)', borderRadius: '0.5rem', padding: '0.5rem 1rem', boxShadow: '0 2px 8px rgba(41,82,40,0.04)' }}>
                  {type === 'amenity' ? (data as Amenity).descripcion : (data as Property).info}
                </p>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
                {/* Characteristics */}
                {((type === 'property' || type === 'business') && (data as Property).caracteristicas?.length > 0) ||
                 (type === 'amenity' && (data as Amenity).caracteristicas?.length > 0) ? (
                  <div>
                    <h5 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colorOscuro }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorClaro }} />
                      Características
                    </h5>
                    <ul className="space-y-2">
                      {(type === 'amenity' ? (data as Amenity).caracteristicas : (data as Property).caracteristicas).map((caracteristica: string, index: number) => (
                        <li key={index} className="flex items-center gap-3 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorClaro }} />
                          <span style={{ color: colorOscuro }}>{caracteristica}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Coordinates */}
                {data.coordenadas && (
                  <div>
                    <h5 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colorOscuro }}>
                      <MapPin className="w-4 h-4" style={{ color: colorClaro }} />
                      Coordenadas
                    </h5>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-start gap-1">
                        <p className="text-sm font-mono" style={{ color: colorOscuro, background: 'rgba(255,255,255,0.7)', borderRadius: '0.25rem', padding: '0.25rem 0.75rem', minWidth: '70px' }}>
                          <span className="font-semibold">X:</span> {data.coordenadas.x}
                        </p>
                        <p className="text-sm font-mono" style={{ color: colorOscuro, background: 'rgba(255,255,255,0.7)', borderRadius: '0.25rem', padding: '0.25rem 0.75rem', minWidth: '70px' }}>
                          <span className="font-semibold">Z:</span> {data.coordenadas.z}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nearby amenities for properties */}
                {(type === 'property' || type === 'business') && (data as Property).comodidadesCercanas?.length > 0 && (
                  <div className="md:col-span-2">
                    <h5 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: colorOscuro }}>
                      <Sparkles className="w-4 h-4" style={{ color: colorClaro }} />
                      Comodidades Cercanas
                    </h5>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {(data as Property).comodidadesCercanas.map((amenityId: string) => {
                        const amenity = townData.textos.comodidades.find(a => a.id === amenityId);
                        return amenity ? (
                          <span 
                            key={amenityId}
                            className="px-4 py-2 rounded-full text-sm font-semibold border shadow-sm"
                            style={{ 
                              backgroundColor: `rgba(255,255,255, 0.5)`,
                              borderColor: colorClaro,
                              color: colorOscuro,
                              boxShadow: '0 2px 8px rgba(41,82,40,0.08)'
                            }}
                          >
                            {amenity.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"
          style={{ 
            background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
          }}
        />
      </div>
    </BasicCard>
  );
}
