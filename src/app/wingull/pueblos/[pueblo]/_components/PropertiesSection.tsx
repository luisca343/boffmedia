import { useState } from "react";
import { TownData } from "../types";
import { PropertyCard } from "./PropertyCard";


interface PropertiesSectionProps {
  townData: TownData;
  townName: string;
}

export function PropertiesSection({ townData, townName }: PropertiesSectionProps) {
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: number]: number }>({});
  const { colorClaro, colorMedio, colorOscuro, parcelas } = townData.textos;

  if (!parcelas?.length) return null;

  const handleImageSelect = (propertyId: number, imageIndex: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [propertyId]: imageIndex
    }));
  };

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        background: `linear-gradient(225deg, ${colorOscuro} 0%, ${colorMedio} 50%, ${colorClaro} 100%)`
      }}
    >
      {/* SVG wave transition at top */}
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorOscuro} />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.7" />
        </svg>
      </div>
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full animate-pulse" 
          style={{ backgroundColor: colorOscuro, animationDelay: '0s' }} 
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full animate-pulse" 
          style={{ backgroundColor: colorClaro, animationDelay: '2s' }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-6">
            <span 
                style={{ textShadow: `2px 2px 4px ${colorOscuro}` }}
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
            style={{ borderColor: `${colorMedio}20` }}
          >
            <h3 className="text-3xl font-bold text-white mb-4">
              ¿No encuentras lo que buscas?
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Nuestro equipo puede ayudarte a encontrar la parcela perfecta o informarte sobre futuras disponibilidades en Pueblo {townName}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="px-8 py-4 rounded-2xl text-white border-2 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                style={{ borderColor: colorClaro, color: colorClaro }}
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