import Image from "next/image";
import { Property, TownData } from "../types";
import { ArrowRight, Eye, Home, MapPin, Star, ChevronDown, Sparkles, Calendar, Shield } from "lucide-react";
import { getIconComponent } from "../utils";
import { ImageShowcase } from "./ImageShowcase";

interface PropertyCardProps {
  property: Property;
  isExpanded: boolean;
  onToggle: () => void;
  townData: TownData;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
}

export function PropertyCard({ property, isExpanded, onToggle, townData, selectedImageIndex, onImageSelect }: PropertyCardProps) {
  const { colorClaro, colorMedio, colorOscuro, comodidades } = townData.textos;
  const nearbyAmenities = comodidades?.filter(amenity => 
    property.comodidadesCercanas.includes(amenity.id)
  ) || [];

  // Get images for this property
  const propertyImages = townData.images?.filter(img => 
    img.includes(`parcela${property.id}`)
  ) || [];
  
  // If no specific images, use a placeholder or default
  const allImages = propertyImages.length > 0 ? propertyImages : [];
  const currentImage = allImages[selectedImageIndex] || allImages[0];

  return (
    <div className="group relative">
      {/* Clean card with normal background */}
  <div className="relative backdrop-blur-sm rounded-2xl border  overflow-hidden transition-all duration-300 hover:shadow-lg text-slate-100"
    style={{ background: `${colorMedio}70`, borderColor: colorClaro }}
  >
        
        {/* Decorative accent bar using town colors */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }}
        />
        
        {/* Decorative corner accents using town colors */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl opacity-70 z-20" style={{ borderColor: colorClaro }} />
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl opacity-70 z-20" style={{ borderColor: colorClaro }} />

        {/* Property badge with clean design */}
        <div className="absolute top-6 left-6 z-30">
          <div 
            className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border text-sm font-bold tracking-wider flex items-center gap-2 shadow-sm"
            style={{ borderColor: `${colorMedio}30` }}
          >
            <Shield className="w-4 h-4" style={{ color: colorMedio }} />
            <span style={{ color: colorMedio }}>PARCELA #{property.id}</span>
          </div>
        </div>

        {/* Image section with ImageShowcase */}
        <div className="relative">
          {allImages.length > 0 ? (
            <ImageShowcase
              images={allImages}
              selectedImageIndex={selectedImageIndex}
              onImageSelect={onImageSelect}
              alt={property.name}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
              className="h-72 lg:h-80"
              overlayContent={
                <>
                  {/* Property title overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 shadow-sm">
                      <h3 className="text-xl lg:text-2xl font-bold" style={{color: colorMedio}}>
                        {property.name}
                      </h3>
                      <p className="text-sm mt-1" style={{color: colorOscuro}}>
                        Parcela #{property.id}
                      </p>
                    </div>
                  </div>
                </>
              }
            />
          ) : (
            <div className="relative h-72 lg:h-80 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <Home className="w-16 h-16 mx-auto mb-4" style={{ color: colorOscuro }} />
                <p style={{ color: colorMedio }}>No hay imágenes disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Content section with clean layout */}
        <div className="p-6 lg:p-8">
          {/* Description */}
          <div className="mb-6">
            <p className="text-base leading-relaxed" style={{color: colorClaro}}>
              {property.info}
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {property.caracteristicas.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200" 
                style={{ background: `${colorClaro}50` }}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colorOscuro }} 
                />
                <span className="text-sm font-medium" style={{ color: colorClaro }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Nearby amenities */}
          {nearbyAmenities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: colorMedio }}
              >
                Comodidades Cercanas
              </h4>
              <div className="flex flex-wrap gap-2">
                {nearbyAmenities.slice(0, 3).map((amenity) => {
                  const IconComponent = getIconComponent(amenity.icon);
                  return (
                    <div 
                      key={amenity.id} 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                      style={{ background: `${colorClaro}50`, color: colorClaro }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: colorOscuro }} />
                      <span>{amenity.name}</span>
                    </div>
                  );
                })}
                {nearbyAmenities.length > 3 && (
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm" style={{ background: `${colorClaro}10`, color: colorMedio }}>
                    +{nearbyAmenities.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expandable details */}
          <div 
            className="transition-all duration-300 ease-in-out overflow-hidden"
            style={{ 
              maxHeight: isExpanded ? '500px' : '0px',
              opacity: isExpanded ? 1 : 0
            }}
          >
            {isExpanded && (
              <div className="pt-4 border-t" style={{ borderColor: colorClaro }}>
                <h4 className="text-lg font-semibold mb-3" style={{ color: colorClaro }}>
                  Detalles Completos
                </h4>
                <p className="leading-relaxed mb-4" style={{ color: colorClaro }}>
                  {property.detalle}
                </p>
                {/* All amenities */}
                {nearbyAmenities.length > 3 && (
                  <div>
                    <h5 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: colorMedio }}>
                      Todas las Comodidades Cercanas
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {nearbyAmenities.map((amenity) => {
                        const IconComponent = getIconComponent(amenity.icon);
                        return (
                          <div 
                            key={amenity.id} 
                            className="flex items-center gap-3 p-3 rounded-lg"
                            style={{ background: `${colorClaro}10` }}
                          >
                            <IconComponent className="w-5 h-5" style={{ color: colorMedio }} />
                            <div>
                              <p className="font-medium text-sm" style={{ color: colorOscuro }}>
                                {amenity.name}
                              </p>
                              <p className="text-xs" style={{ color: colorMedio }}>
                                {amenity.descripcion}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button 
              onClick={onToggle}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium transition-all duration-300 hover:scale-105 flex-1"
              style={{ 
                borderColor: colorClaro, 
                color: colorClaro
              }}
            >
              <Eye className="w-4 h-4" />
              {isExpanded ? 'Ver Menos' : 'Ver Detalles'}
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <button 
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-all duration-300 hover:scale-105"
              style={{ background: `${colorClaro}10`, color: colorClaro, borderColor: colorClaro }}
            >
              <Sparkles className="w-4 h-4" style={{ color: colorClaro }} />
              Contactar
            </button>
          </div>
        </div>
        
        {/* Subtle glow effect on hover using town colors */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
          style={{ 
            background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
          }}
        />
      </div>
    </div>
  );
}
