import { useState } from "react";
import { TownData, Property, Amenity, SelectedMarker } from "../types";
import { TownMap } from "./TownMap";
import { SectionHeader } from "./SectionHeader";
import { MarkerDetailsPanel } from "./MarkerDetailsPanel";

interface TownMapSectionProps {
  townData: TownData;
  townName: string;
}

export function TownMapSection({ townData, townName }: TownMapSectionProps) {
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { colorClaro, colorMedio, colorOscuro, coordenadas, parcelas, negocios, nombre } = townData.textos;

  // Check if we have coordinates to show the map
  const hasCoordinates = coordenadas || 
    parcelas.some(p => p.coordenadas) || 
    negocios.some(b => b.coordenadas);

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
          description={<span>Explora la ubicación de las parcelas disponibles en {nombre} y navega por el territorio</span>}
          townName={nombre}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        <div className="relative backdrop-blur-sm rounded-2xl border p-8 shadow-lg text-slate-100 max-w-6xl mx-auto overflow-hidden"
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
            townName={nombre}
            selectedMarker={selectedMarker}
            onMarkerSelect={setSelectedMarker}
          />

          {/* Selected marker details */}
          {selectedMarker && (
            <MarkerDetailsPanel 
              selectedMarker={selectedMarker}
              selectedImageIndex={selectedImageIndex}
              onImageSelect={setSelectedImageIndex}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
              townData={townData}
            />
          )}
        </div>
      </div>
    </section>
  );
}
