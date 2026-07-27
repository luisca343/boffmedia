import { useTranslations } from "next-intl";
import { Property, TownData } from "../../types";
import { ArrowRight, Eye, Home, MapPin, Star, ChevronDown, Sparkles, Calendar, Shield, Building2 } from "lucide-react";
import { getIconComponent } from "../../utils";
import { ImageShowcase } from "../shared/image/ImageShowcase";
import { BasicCard } from "../shared/cards/BasicCard";
interface PropertyCardProps {
  property: Property;
  isExpanded: boolean;
  onToggle: () => void;
  townData: TownData;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
  type: 'parcela' | 'negocio'; // New parameter to distinguish property type
}

export function PropertyCard({ property, isExpanded, onToggle, townData, selectedImageIndex, onImageSelect, type }: PropertyCardProps) {
  const t = useTranslations("wingull.properties");
  const { colorClaro, colorMedio, colorOscuro, comodidades } = townData.textos;
  const nearbyAmenities = comodidades?.filter(amenity => 
    property.comodidadesCercanas.includes(amenity.id)
  ) || [];

  // Get images for this property based on type
  const propertyImages = townData.images?.filter(img => 
    img.includes(`${type}${property.id}`)
  ) || [];
  
  // If no specific images, use a placeholder or default
  const allImages = propertyImages.length > 0 ? propertyImages : [];
  const currentImage = allImages[selectedImageIndex] || allImages[0];

  return (
    <BasicCard
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
    >
      {/* Property badge with clean design */}
      <div className="absolute top-6 left-6 z-30">
          <div 
            className="px-4 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border text-sm font-bold tracking-wider flex items-center gap-2 shadow-sm"
            style={{ borderColor: `${colorMedio}30` }}
          >
            <Shield className="w-4 h-4" style={{ color: colorMedio }} />
            <span style={{ color: colorMedio }}>
              {type === 'parcela' ? t('badgeParcela') : t('badgeLocal')} #{property.id}
            </span>
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
                        {type === 'parcela' ? t('typeParcela') : t('typeLocal')} #{property.id}
                      </p>
                    </div>
                  </div>
                </>
              }
            />
          ) : (
            <div className="relative h-72 lg:h-80 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                {type === 'parcela' ? (
                  <Home className="w-16 h-16 mx-auto mb-4" style={{ color: colorOscuro }} />
                ) : (
                  <Building2 className="w-16 h-16 mx-auto mb-4" style={{ color: colorOscuro }} />
                )}
                <p style={{ color: colorMedio }}>{t('noImages')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Content section with clean layout */}
        <div className="p-6 lg:p-8">
          {/* Description */}
          <div className="mb-6">
            <p className="text-base leading-relaxed" style={{color: 'white'}}>
              {property.info}
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {property.caracteristicas.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 rounded-lg bg-white/10 transition-all duration-200 hover:bg-white/20" 
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: colorClaro }} 
                />
                <span className="text-sm font-medium" style={{ color: 'white' }}>
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Nearby amenities */}
          {nearbyAmenities.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider mb-3"
                style={{ color: 'white' }}
              >
                {t('nearbyAmenities')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {nearbyAmenities.slice(0, 3).map((amenity) => {
                  const IconComponent = getIconComponent(amenity.icon);
                  return (
                    <div 
                      key={amenity.id} 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm  bg-white/10 transition-all duration-200 hover:bg-white/20"
                    >
                      <IconComponent className="w-4 h-4" style={{ color: colorClaro }} />
                      <span>{amenity.name}</span>
                    </div>
                  );
                })}
                {nearbyAmenities.length > 3 && (
                  <div className="flex items-center px-3 py-2 rounded-lg text-sm" style={{ background: `${colorClaro}10`, color: colorMedio }}>
                    {t('moreAmenities', { count: nearbyAmenities.length - 3 })}
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
                  {t('fullDetails')}
                </h4>
                <p className="leading-relaxed mb-4" style={{ color: colorClaro }}>
                  {property.detalle}
                </p>
                {/* All amenities */}
                {nearbyAmenities.length > 3 && (
                  <div>
                    <h5 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: colorMedio }}>
                      {t('allNearbyAmenities')}
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
              {isExpanded ? t('viewLess') : t('viewDetails')}
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
            
            <button 
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border transition-all duration-300 hover:scale-105"
              style={{ background: `${colorClaro}10`, color: colorClaro, borderColor: colorClaro }}
            >
              <Sparkles className="w-4 h-4" style={{ color: colorClaro }} />
              {t('buy')}
            </button>
          </div>
        </div>
    </BasicCard>
  );
}
