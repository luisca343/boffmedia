'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Sparkles, 
  Users, 
  ChevronDown, 
  HeartPulse, 
  Microscope, 
  Shield, 
  Store, 
  Dumbbell, 
  BookOpen,
  MapPin,
  Star,
  Eye,
  Home,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import { WingullService } from '@/services/api/smartrotom/wingullService';

// Types
interface TownData {
  textos: {
    color: string;
    frasebonita: string;
    descripcion: string;
    comodidades: Amenity[];
    parcelas: Property[];
  };
  fondo?: string;
  images?: string[];
}

interface Amenity {
  id: string;
  name: string;
  descripcion: string;
  icon: string;
  image?: string;
  caracteristicas: string[];
}

interface Property {
  id: number;
  name: string;
  info: string;
  detalle: string;
  caracteristicas: string[];
  comodidadesCercanas: string[];
  images?: string[]; // Add support for individual property images
}



function getIconComponent(iconName: string) {
  const icons: { [key: string]: React.ComponentType<any> } = {
    'heart-pulse': HeartPulse,
    'microscope': Microscope,
    'shield': Shield,
    'store': Store,
    'dumbbell': Dumbbell,
    'book-open': BookOpen
  };
  return icons[iconName] || MapPin;
}

interface HeroSectionProps {
  townName: string;
  townData: TownData;
  onScrollToContent: () => void;
}

function HeroSection({ townName, townData, onScrollToContent }: HeroSectionProps) {
  const { color, frasebonita, descripcion } = townData.textos;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
      {townData.fondo && (
        <div 
          className="absolute inset-0 opacity-40" 
          style={{ 
            backgroundImage: `url(${townData.fondo})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
          }} 
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40" />
      <div 
        className="absolute inset-0 animate-pulse" 
        style={{ 
          background: `radial-gradient(ellipse at center, ${color}30 0%, transparent 50%), linear-gradient(135deg, ${color}20 0%, transparent 70%)` 
        }} 
      />
      
      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 -right-32 w-96 h-96 rounded-full opacity-20 animate-pulse" 
          style={{ backgroundColor: color }} 
        />
        <div 
          className="absolute bottom-1/4 -left-32 w-80 h-80 rounded-full opacity-15 animate-pulse" 
          style={{ backgroundColor: color, animationDelay: '1s' }} 
        />
        <div 
          className="absolute top-3/4 right-1/4 w-64 h-64 rounded-full opacity-10 animate-pulse" 
          style={{ backgroundColor: color, animationDelay: '2s' }} 
        />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-8xl font-black text-white capitalize tracking-tight">
              <span className="block">Pueblo</span>
              <span 
                className="block bg-gradient-to-r bg-clip-text text-transparent animate-pulse" 
                style={{ backgroundImage: `linear-gradient(135deg, white 0%, ${color} 50%, white 100%)` }}
              >
                {townName}
              </span>
            </h1>
            <p 
              className="text-2xl lg:text-4xl font-bold text-white drop-shadow-2xl animate-pulse" 
              style={{ 
                textShadow: `0 0 30px ${color}80, 0 0 60px ${color}40`, 
                animationDelay: '0.8s' 
              }}
            >
              {frasebonita}
            </p>
          </div>
          
          <p 
            className="text-xl lg:text-2xl text-gray-200 max-w-4xl mx-auto leading-relaxed font-light backdrop-blur-sm bg-black/40 rounded-2xl p-8 border" 
            style={{ borderColor: `${color}30` }}
          >
            {descripcion}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <button 
              className="text-lg px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 text-white border-2 bg-transparent hover:bg-white/10" 
              style={{ borderColor: color, color: color }} 
              onClick={onScrollToContent}
            >
              <Sparkles className="w-6 h-6 mr-3 inline" />
              Explorar Pueblo
            </button>
            <button className="text-lg px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 border-2 transition-all duration-300 hover:scale-105">
              <Users className="w-6 h-6 mr-3 inline" />
              Ver Comunidad
            </button>
          </div>
          
          <div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer" 
            onClick={onScrollToContent}
          >
            <div 
              className="w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border hover:bg-white/20 transition-colors" 
              style={{ 
                backgroundColor: color + '30', 
                borderColor: `${color}50` 
              }}
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AmenitiesSectionProps {
  townData: TownData;
  townName: string;
}

function AmenitiesSection({ townData, townName }: AmenitiesSectionProps) {
  const { color, comodidades } = townData.textos;

  if (!comodidades?.length) return null;

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full animate-pulse" 
          style={{ backgroundColor: color }} 
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full animate-pulse" 
          style={{ backgroundColor: color, animationDelay: '1s' }} 
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-6">
            <span 
              className="bg-gradient-to-r bg-clip-text text-transparent" 
              style={{ backgroundImage: `linear-gradient(135deg, white 0%, ${color} 100%)` }}
            >
              Comodidades del Pueblo
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Descubre todas las facilidades que hacen de Pueblo {townName} el lugar perfecto para establecer tu base
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {comodidades.map((amenity) => {
            const IconComponent = getIconComponent(amenity.icon);
            return (
              <div key={amenity.id} className="group relative">
                <div 
                  className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border transition-all duration-500 hover:scale-105 hover:bg-slate-700/50 h-full" 
                  style={{ borderColor: `${color}30` }}
                >
                  {amenity.image && (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
                      <Image
                        src={amenity.image}
                        alt={amenity.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="p-4 rounded-2xl transition-colors" 
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color }} />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{amenity.name}</h3>
                  </div>
                  
                  <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    {amenity.descripcion}
                  </p>
                  
                  <div className="space-y-3">
                    {amenity.caracteristicas.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: color }} 
                        />
                        <span className="text-gray-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface PropertyCardProps {
  property: Property;
  isExpanded: boolean;
  onToggle: () => void;
  townData: TownData;
  selectedImageIndex: number;
  onImageSelect: (index: number) => void;
}

function PropertyCard({ property, isExpanded, onToggle, townData, selectedImageIndex, onImageSelect }: PropertyCardProps) {
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

interface PropertiesSectionProps {
  townData: TownData;
  townName: string;
}

function PropertiesSection({ townData, townName }: PropertiesSectionProps) {
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: number]: number }>({});
  const { color, parcelas } = townData.textos;

  if (!parcelas?.length) return null;

  const handleImageSelect = (propertyId: number, imageIndex: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [propertyId]: imageIndex
    }));
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full animate-pulse" 
          style={{ backgroundColor: color, animationDelay: '0s' }} 
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full animate-pulse" 
          style={{ backgroundColor: color, animationDelay: '2s' }} 
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-6">
            <span 
              className="bg-gradient-to-r bg-clip-text text-transparent" 
              style={{ backgroundImage: `linear-gradient(135deg, ${color} 0%, white 100%)` }}
            >
              Parcelas Disponibles
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Encuentra tu hogar perfecto en Pueblo {townName}. Cada parcela ofrece una experiencia única con acceso a diferentes comodidades
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {parcelas.map((property) => (
            <PropertyCard 
              key={property.id}
              property={property}
              isExpanded={expandedProperty === property.id}
              onToggle={() => setExpandedProperty(expandedProperty === property.id ? null : property.id)}
              townData={townData}
              selectedImageIndex={selectedImages[property.id] || 0}
              onImageSelect={(imageIndex) => handleImageSelect(property.id, imageIndex)}
            />
          ))}
        </div>

        {/* Call to action section */}
        <div className="mt-20 text-center">
          <div 
            className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-12 border"
            style={{ borderColor: `${color}20` }}
          >
            <h3 className="text-3xl font-bold text-white mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Nuestro equipo puede ayudarte a encontrar la parcela perfecta o informarte sobre futuras disponibilidades en Pueblo {townName}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="px-8 py-4 rounded-2xl text-white border-2 hover:bg-white/10 transition-all duration-300 hover:scale-105 font-bold"
                style={{ borderColor: color, color }}
              >
                Contactar Agente
              </button>
              <button className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 border-2 transition-all duration-300 hover:scale-105 font-medium">
                Ver Más Pueblos
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-white">Cargando información del pueblo...</h2>
        <p className="text-gray-400">Preparando tu experiencia inmobiliaria</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-white">Error al cargar el pueblo</h2>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

export default function TownRealEstatePage() {
  const params = useParams();
  const pueblo = Array.isArray(params.pueblo) ? params.pueblo[0] : params.pueblo;
  const [townData, setTownData] = useState<TownData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchTownData = async () => {
    if (!pueblo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await WingullService.getTownInfo(pueblo);
      setTownData(response.data);
    } catch (error) {
      console.error('Error fetching town data:', error);
      setError('No se pudo cargar la información del pueblo. Por favor, verifica el nombre e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTownData();
  }, [pueblo]);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!pueblo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">Pueblo no especificado</h2>
          <p className="text-gray-400">Por favor, proporciona el nombre del pueblo en la URL</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={fetchTownData} />;
  }

  if (!townData) {
    return <ErrorScreen error="No se encontraron datos para este pueblo" onRetry={fetchTownData} />;
  }

  return (
    <div className="min-h-screen">
      <HeroSection 
        townName={pueblo} 
        townData={townData} 
        onScrollToContent={scrollToContent} 
      />
      <div ref={contentRef}>
        <AmenitiesSection townData={townData} townName={pueblo} />
        <PropertiesSection townData={townData} townName={pueblo} />
      </div>
    </div>
  );
}