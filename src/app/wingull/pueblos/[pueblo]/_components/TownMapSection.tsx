import { useState } from "react";
import { TownData, Property } from "../types";
import { TownMap } from "./TownMap";
import { SectionHeader } from "./SectionHeader";

interface TownMapSectionProps {
  townData: TownData;
  townName: string;
}

export function TownMapSection({ townData, townName }: TownMapSectionProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const { colorClaro, colorMedio, colorOscuro, coordenadas, parcelas } = townData.textos;

  // Check if we have coordinates to show the map
  const hasCoordinates = coordenadas || parcelas.some(p => p.coordenadas);

  if (!hasCoordinates) {
    return null;
  }

  return (
    <section
      className="py-24 relative overflow-hidden bg-gradient-to-tr from-surface-600 to-surface-700"
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

      <div className="relative z-10 max-w-[90%] mx-auto px-6">
        <SectionHeader
          title={<span style={{color: colorClaro}}>Mapa</span>}
          subtitle={<span style={{color: colorMedio}}>Interactivo</span>}
          description={<span>Explora la ubicación de las parcelas disponibles en Pueblo {townName} y navega por el territorio</span>}
          townName={townName}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        <div className="relative backdrop-blur-sm rounded-2xl border p-8 shadow-lg text-slate-100"
             style={{ background: `${colorMedio}70`, borderColor: colorClaro }}>
          
          {/* Decorative accent bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }}
          />
          
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl opacity-70" style={{ borderColor: colorClaro }} />
          <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl opacity-70" style={{ borderColor: colorClaro }} />

          <TownMap
            townData={townData}
            townName={townName}
            selectedProperty={selectedProperty}
            onPropertySelect={setSelectedProperty}
          />

          {/* Selected property details */}
          {selectedProperty && (
            <div className="mt-8 p-6 rounded-xl border-2" style={{ borderColor: colorClaro, backgroundColor: `${colorClaro}20` }}>
              <h4 className="text-xl font-bold mb-2" style={{ color: colorClaro }}>
                {selectedProperty.name}
              </h4>
              <p className="mb-4" style={{ color: colorMedio }}>
                {selectedProperty.info}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-semibold mb-2" style={{ color: colorOscuro }}>Características</h5>
                  <ul className="space-y-1">
                    {selectedProperty.caracteristicas.map((caracteristica, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMedio }} />
                        <span style={{ color: colorClaro }}>{caracteristica}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedProperty.coordenadas && (
                  <div>
                    <h5 className="font-semibold mb-2" style={{ color: colorOscuro }}>Coordenadas</h5>
                    <p className="text-sm" style={{ color: colorMedio }}>
                      X: {selectedProperty.coordenadas.x}<br />
                      Z: {selectedProperty.coordenadas.z}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Map instructions */}
          <div className="mt-6 p-4 rounded-lg bg-black/20 border" style={{ borderColor: `${colorMedio}30` }}>
            <h5 className="font-semibold mb-2" style={{ color: colorClaro }}>Cómo usar el mapa</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorClaro }} />
                <span style={{ color: colorMedio }}>Arrastra para navegar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorMedio }} />
                <span style={{ color: colorMedio }}>Rueda del ratón para zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorOscuro }} />
                <span style={{ color: colorMedio }}>Click en parcelas para detalles</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
