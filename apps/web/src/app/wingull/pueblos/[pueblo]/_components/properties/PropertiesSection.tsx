import { useState } from "react";
import { TownData } from "../../types";
import { SectionHeader } from "../shared/section/SectionHeader";
import { PropertyCard } from "./PropertyCard";
import { PropertiesCTA } from "./PropertiesCTA";
import { SectionTemplate } from "../shared/section/SectionTemplate";

interface PropertiesSectionProps {
  townData: TownData;
  townName: string;
}

export function PropertiesSection({ townData, townName }: PropertiesSectionProps) {
  const [expandedProperty, setExpandedProperty] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: number]: number }>({});
  const { colorClaro, colorMedio, colorOscuro, parcelas, nombre } = townData.textos;

  if (!parcelas?.length) return null;

  const handleImageSelect = (propertyId: number, imageIndex: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [propertyId]: imageIndex
    }));
  };

  return (
    <SectionTemplate
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      backgroundGradient="bg-gradient-to-bl from-surface-800 to-surface-600"
    >
      
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorOscuro} opacity="0.05" />
        </svg>
      </div>

      <div className="max-w-[80%] mx-auto">
        <SectionHeader
          title={<span style={{color: colorClaro}}>Parcelas</span>}
          subtitle={<span style={{color: colorMedio}}>Disponibles</span>}
          description={<span>Encuentra tu hogar perfecto en {nombre}. Cada parcela ofrece una experiencia única con acceso a diferentes comodidades</span>}
          townName={nombre}
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
              onImageSelect={(index) => handleImageSelect(property.id, index)}
              type="parcela"
            />
          ))}
        </div>
      </div>
    </SectionTemplate>
  );
}

