'use client';

import { useState } from 'react';
import { TownData, Property } from '../../types';
import { PropertyCard } from './PropertyCard';
import { SectionHeader } from '../shared/section/SectionHeader';
import { SectionTemplate } from '../shared/section/SectionTemplate';

interface BusinessSectionProps {
  townData: TownData;
  townName: string;
}

export function BusinessSection({ townData, townName }: BusinessSectionProps) {
  const [expandedBusiness, setExpandedBusiness] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ [key: number]: number }>({});
  const { colorClaro, colorMedio, colorOscuro, negocios, nombre } = townData.textos;

  if (!negocios?.length) return null;

  const handleImageSelect = (businessId: number, imageIndex: number) => {
    setSelectedImages(prev => ({
      ...prev,
      [businessId]: imageIndex
    }));
  };

  return (
    <SectionTemplate
      colorClaro={colorClaro}
      colorMedio={colorMedio}
      colorOscuro={colorOscuro}
      backgroundGradient="bg-gradient-to-br from-surface-600 to-surface-800"
    >
      <div className="container mx-auto px-4">
        <SectionHeader
          title={
            <>
              <span style={{color: colorClaro}}>Oportunidades</span>
              <span className="text-yellow-400"> de Negocio</span>
            </>
          }
          subtitle={
            <span className="text-lg text-slate-300">
              Oportunidades de negocio en {nombre}
            </span>
          }
          description={
            <span>
              Descubre las ubicaciones comerciales disponibles en {nombre} para 
              establecer tu próximo emprendimiento en este próspero pueblo
            </span>
          }
          townName={nombre}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {negocios.map((business) => (
            <PropertyCard
              key={business.id}
              property={business}
              isExpanded={expandedBusiness === business.id}
              onToggle={() => setExpandedBusiness(expandedBusiness === business.id ? null : business.id)}
              townData={townData}
              selectedImageIndex={selectedImages[business.id] || 0}
              onImageSelect={(index) => handleImageSelect(business.id, index)}
              type="negocio"
            />
          ))}
        </div>
      </div>

      {/* SVG wave transition at bottom for next section */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,20 C480,60 960,-20 1440,20 L1440,80 L0,80 Z" fill={colorClaro} opacity="0.05" />
        </svg>
      </div>
    </SectionTemplate>
  );
}

interface BusinessSectionProps {
  townData: TownData;
  townName: string;
}

