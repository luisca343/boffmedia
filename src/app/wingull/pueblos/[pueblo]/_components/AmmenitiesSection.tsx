import Image from "next/image";
import { TownData } from "../types";
import { getIconComponent } from "../utils";
import { SectionHeader } from "./SectionHeader";
import { AmenityCard } from "./AmenityCard";

interface AmenitiesSectionProps {
  townData: TownData;
  townName: string;
}

export function AmenitiesSection({ townData, townName }: AmenitiesSectionProps) {
  const { colorClaro, colorMedio, colorOscuro, comodidades, nombre } = townData.textos;

  if (!comodidades?.length) return null;

  return (
    <section
      className="pt-0 pb-24 relative overflow-hidden bg-gradient-to-br from-surface-700 to-surface-800"
    >
      {/* Top SVG wave transition from HeroSection with town colors */}
      <div className="absolute left-0 right-0 top-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z" fill={colorClaro} opacity="0.1" />
          <path d="M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z" fill={colorMedio} opacity="0.05" />
        </svg>
      </div>
      
      {/* Decorative floating elements using town colors */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-32 left-10 w-64 h-64 rounded-full opacity-8 animate-pulse" 
          style={{ backgroundColor: colorClaro }} 
        />
        <div 
          className="absolute bottom-32 right-10 w-80 h-80 rounded-full opacity-6 animate-pulse" 
          style={{ backgroundColor: colorMedio, animationDelay: '1s' }} 
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-4 animate-pulse" 
          style={{ backgroundColor: colorOscuro, animationDelay: '2s' }} 
        />
        
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{ 
            background: `radial-gradient(ellipse at top left, ${colorClaro}15 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${colorMedio}12 0%, transparent 50%)`
          }}
        />
      </div>
      
      {/* SVG wave transition at bottom with town colors */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorMedio} opacity="0.08" />
          <path d="M0,65 C480,75 960,45 1440,65 L1440,80 L0,80 Z" fill={colorOscuro} opacity="0.05" />
        </svg>
      </div>
      <div className="relative z-10 max-w-[80%] mx-auto px-6 pt-40">
        <SectionHeader
          title={<span style={{color: colorClaro}}>Comodidades</span>}
          subtitle={<span style={{color: colorMedio}}>del Pueblo</span>}
          description={<span>Descubre todas las facilidades que hacen de {nombre} el lugar perfecto para establecer tu base</span>}
          townName={nombre}
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {comodidades.map((amenity) => (
            <AmenityCard 
              key={amenity.id}
              amenity={amenity}
              colorClaro={colorClaro}
              colorMedio={colorMedio}
              colorOscuro={colorOscuro}
            />
          ))}
        </div>
      </div>
    </section>
  );
}