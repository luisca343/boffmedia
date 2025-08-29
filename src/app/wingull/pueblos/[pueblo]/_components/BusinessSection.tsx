'use client';

import { useState } from 'react';
import { TownData, Property } from '../types';
import { PropertyCard } from './PropertyCard';
import { SectionHeader } from './SectionHeader';

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
    <section
      className="py-24 relative overflow-hidden bg-gradient-to-br from-surface-600 to-surface-800"
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
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <SectionHeader
          title={
            <>
              <span style={{ color: colorClaro }}>Locales</span>{' '}
              <span className="text-white">Comerciales</span>
            </>
          }
          subtitle={
            <span className="text-lg text-slate-300">
              Oportunidades de negocio en {nombre}
            </span>
          }
          description={
            <p className="text-slate-400 leading-relaxed">
              Descubre los espacios comerciales disponibles en {nombre}. Cada local está estratégicamente 
              ubicado para maximizar el éxito de tu emprendimiento, desde comercio general hasta servicios especializados.
            </p>
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
              onToggle={() => setExpandedBusiness(
                expandedBusiness === business.id ? null : business.id
              )}
              townData={townData}
              selectedImageIndex={selectedImages[business.id] || 0}
              onImageSelect={(index) => handleImageSelect(business.id, index)}
              type="negocio"
            />
          ))}
        </div>

        {/* Call to action for businesses */}
        <div className="mt-20 text-center">
          <div className="relative backdrop-blur-sm rounded-2xl border overflow-hidden shadow-lg mx-auto max-w-2xl p-8" style={{ background: `${colorMedio}70`, borderColor: colorClaro }}>
            {/* Decorative accent bar using town colors */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }} />

            {/* Corner accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl opacity-70" style={{ borderColor: colorClaro }} />
            <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl opacity-70" style={{ borderColor: colorClaro }} />

            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-4">
              ¿Listo para emprender?
            </h3>
            
            <p className="text-white/90 mb-6 leading-relaxed">
              Los locales comerciales en {nombre} ofrecen oportunidades únicas para hacer crecer tu negocio. 
              Contacta con nosotros para más información sobre disponibilidad y precios.
            </p>
            
            <button 
              className="px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              style={{ 
                backgroundColor: colorClaro, 
                color: colorOscuro,
                boxShadow: `0 4px 20px ${colorClaro}40`
              }}
            >
              Consultar Disponibilidad
            </button>

            {/* Hover effect overlay */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"
              style={{ background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }}
            />
          </div>
        </div>
      </div>

      {/* SVG wave transition at bottom for next section */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,20 C480,60 960,-20 1440,20 L1440,80 L0,80 Z" fill={colorClaro} opacity="0.05" />
        </svg>
      </div>
    </section>
  );
}
