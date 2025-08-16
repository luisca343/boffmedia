import Image from "next/image";
import { Property, TownData } from "../types";
import { ArrowRight, Eye, Home, MapPin, Star } from "lucide-react";
import { getIconComponent } from "../utils";



interface PropertyCardProps {
  property: Property;
  isExpanded: boolean;
  onToggle: () => void;
  townData: TownData;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
}

export function PropertyCard({ property, isExpanded, onToggle, townData, selectedImageIndex, onImageSelect }: PropertyCardProps) {
  const { color, comodidades } = townData.textos;
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
    <div className="group relative overflow-hidden">
      {/* Modern card layout with image showcase */}
      <div 
        className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-purple-500/20" 
        style={{ borderColor: `${color}20` }}
      >
        {/* Image section - Now taking more space and better aspect ratio */}
        <div className="relative">
          {currentImage ? (
            <div className="relative h-80 lg:h-96 overflow-hidden">
              <Image
                src={currentImage}
                alt={property.name}
                fill
                className="object-cover transition-all duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                priority
              />
              
              {/* Enhanced overlay gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
              <div 
                className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 opacity-60"
                style={{ background: `radial-gradient(ellipse at bottom right, ${color}15 0%, transparent 60%)` }}
              />
              
              {/* Property ID badge */}
              <div className="absolute top-6 left-6">
                <div 
                  className="px-4 py-2 rounded-2xl backdrop-blur-md border text-white font-bold text-sm shadow-lg"
                  style={{ 
                    backgroundColor: `${color}20`, 
                    borderColor: `${color}40` 
                  }}
                >
                  Parcela #{property.id}
                </div>
              </div>

              {/* Image counter and navigation */}
              {allImages.length > 1 && (
                <div className="absolute top-6 right-6">
                  <div className="bg-black/50 backdrop-blur-md rounded-2xl px-4 py-2 text-white text-sm font-medium">
                    {selectedImageIndex + 1} / {allImages.length}
                  </div>
                </div>
              )}

              {/* Image navigation arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => onImageSelect(selectedImageIndex > 0 ? selectedImageIndex - 1 : allImages.length - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => onImageSelect(selectedImageIndex < allImages.length - 1 ? selectedImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                  >
                    →
                  </button>
                </>
              )}

              {/* Property title overlay on image */}
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-3xl lg:text-4xl font-black text-white mb-2 drop-shadow-2xl">
                  {property.name}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" style={{ color }} />
                    <span className="text-white/90 font-medium">Ubicación Premium</span>
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="text-white/90 font-medium">Disponible</span>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback for no image */
            <div 
              className="h-80 lg:h-96 flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${color}20 0%, slate-800 100%)` }}
            >
              <div className="text-center space-y-4">
                <Home className="w-16 h-16 mx-auto text-white/60" />
                <h3 className="text-3xl font-black text-white">{property.name}</h3>
                <div className="flex items-center gap-2 justify-center">
                  <Star className="w-5 h-5" style={{ color }} />
                  <span className="text-white/90">Parcela #{property.id}</span>
                </div>
              </div>
            </div>
          )}

          {/* Image thumbnail strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex gap-2 bg-black/50 backdrop-blur-md rounded-2xl p-2">
                {allImages.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onImageSelect(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === selectedImageIndex 
                        ? 'scale-125' 
                        : 'hover:scale-110 opacity-60 hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: index === selectedImageIndex ? color : 'white'
                    }}
                  />
                ))}
                {allImages.length > 5 && (
                  <span className="text-white/60 text-xs font-medium ml-2">+{allImages.length - 5}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="p-8 lg:p-10">
          {/* Quick info and description */}
          <div className="mb-8">
            <p className="text-gray-300 text-lg leading-relaxed">
              {property.info}
            </p>
          </div>

          {/* Features grid - more visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {property.caracteristicas.map((feature, index) => (
              <div 
                key={index} 
                className="relative overflow-hidden rounded-2xl p-4 transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: `${color}10` }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <span className="text-white font-medium">{feature}</span>
                </div>
                <div 
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-20"
                  style={{ backgroundColor: color }}
                />
              </div>
            ))}
          </div>

          {/* Nearby amenities */}
          {nearbyAmenities.length > 0 && (
            <div className="mb-8">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <MapPin className="w-6 h-6" style={{ color }} />
                Comodidades Cercanas
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {nearbyAmenities.map((amenity) => {
                  const IconComponent = getIconComponent(amenity.icon);
                  return (
                    <div 
                      key={amenity.id} 
                      className="group/amenity flex items-center gap-3 bg-slate-700/30 rounded-2xl p-4 transition-all duration-300 hover:bg-slate-600/40 hover:scale-105"
                    >
                      <div 
                        className="p-2 rounded-xl transition-transform duration-300 group-hover/amenity:scale-110"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <IconComponent className="w-5 h-5" style={{ color }} />
                      </div>
                      <span className="text-gray-200 font-medium text-sm">{amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expanded details */}
          {isExpanded && (
            <div 
              className="border-t pt-8 mt-8 animate-in slide-in-from-top duration-500" 
              style={{ borderColor: `${color}20` }}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-white mb-4">Detalles Completos</h4>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {property.detalle}
                  </p>
                </div>
                
                {/* Enhanced image gallery for expanded view */}
                {allImages.length > 1 && (
                  <div>
                    <h4 className="text-xl font-bold text-white mb-4">Galería Completa</h4>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {allImages.map((image, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-video rounded-2xl overflow-hidden group/gallery cursor-pointer"
                          onClick={() => onImageSelect(index)}
                        >
                          <Image
                            src={image}
                            alt={`${property.name} - Vista ${index + 1}`}
                            fill
                            className="object-cover transition-all duration-500 group-hover/gallery:scale-110"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/gallery:bg-black/30 transition-colors duration-300" />
                          <div 
                            className={`absolute inset-0 border-4 transition-all duration-300 rounded-2xl ${
                              index === selectedImageIndex 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover/gallery:opacity-60'
                            }`}
                            style={{ borderColor: color }}
                          />
                          {index === selectedImageIndex && (
                            <div className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button 
              onClick={onToggle}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-slate-700/50 text-white hover:bg-slate-600/50 transition-all duration-300 hover:scale-105 font-medium"
            >
              <Eye className="w-5 h-5" />
              {isExpanded ? 'Menos detalles' : 'Ver detalles completos'}
            </button>
            <button 
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white border-2 hover:bg-white/10 transition-all duration-300 hover:scale-105 font-bold shadow-lg" 
              style={{ borderColor: color, color }}
            >
              <ArrowRight className="w-5 h-5" />
              Reservar Parcela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}