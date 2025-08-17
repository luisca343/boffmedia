import { useState } from "react";
import { PropertiesCTA } from "./PropertiesCTA";
import { TownData } from "../types";
import { PropertyCard } from "./PropertyCard";
import { SectionHeader } from "./SectionHeader";


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
      className="py-24 relative overflow-hidden bg-gradient-to-bl from-surface-800 to-surface-600"
    >
      {/* SVG wave transition at top with town colors */}
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorOscuro} opacity="0.05" />
        </svg>
      </div>
      
      {/* Decorative floating elements using town colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/4 -left-32 w-80 h-80 rounded-full opacity-6 animate-pulse" 
          style={{ backgroundColor: colorClaro, animationDelay: '0s' }} 
        />
        <div 
          className="absolute bottom-1/4 -right-32 w-72 h-72 rounded-full opacity-6 animate-pulse" 
          style={{ backgroundColor: colorOscuro, animationDelay: '2s' }} 
        />
        <div 
          className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-4 animate-pulse" 
          style={{ backgroundColor: colorMedio, animationDelay: '1s' }} 
        />
        
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{ 
            background: `radial-gradient(ellipse at bottom left, ${colorMedio}12 0%, transparent 50%), radial-gradient(ellipse at top right, ${colorOscuro}08 0%, transparent 50%)`
          }}
        />
      </div>

      <div className="relative z-10 max-w-[80%] mx-auto px-6">
        <SectionHeader
          title={<span style={{color: colorClaro}}>Parcelas</span>}
          subtitle={<span style={{color: colorMedio}}>Disponibles</span>}
          description={<span>Encuentra tu hogar perfecto en Pueblo {townName}. Cada parcela ofrece una experiencia única con acceso a diferentes comodidades</span>}
          townName={townName}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

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
              <PropertiesCTA 
                townName={townName}
                colorClaro={colorClaro}
                colorMedio={colorMedio}
                colorOscuro={colorOscuro}
              />
        </div>
      </div>
    </section>
  );
}