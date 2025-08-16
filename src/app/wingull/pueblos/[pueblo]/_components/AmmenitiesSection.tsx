import Image from "next/image";
import { TownData } from "../types";
import { getIconComponent } from "../utils";

interface AmenitiesSectionProps {
  townData: TownData;
  townName: string;
}

export function AmenitiesSection({ townData, townName }: AmenitiesSectionProps) {
  const { colorClaro, colorMedio, colorOscuro, comodidades } = townData.textos;

  if (!comodidades?.length) return null;

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
      }}
    >
      <div className="absolute inset-0">
        <div 
          className="absolute top-20 left-10 w-72 h-72 rounded-full animate-pulse" 
          style={{ backgroundColor: colorClaro }} 
        />
        <div 
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full animate-pulse" 
          style={{ backgroundColor: colorOscuro, animationDelay: '1s' }} 
        />
      </div>
      {/* SVG wave transition at bottom */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none" style={{height: '80px'}}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="100%" height="80">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={colorMedio} />
          <path d="M0,60 C480,100 960,20 1440,60 L1440,80 L0,80 Z" fill={colorOscuro} opacity="0.7" />
        </svg>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white mb-6">
            <span 
                style={{ textShadow: `2px 2px 4px ${colorOscuro}` }}
            >
              Comodidades del Pueblo
            </span>
          </h2>
          <p className="text-xl text-surface-700/70 max-w-3xl mx-auto">
            Descubre todas las facilidades que hacen de Pueblo {townName} el lugar perfecto para establecer tu base
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {comodidades.map((amenity) => {
            const IconComponent = getIconComponent(amenity.icon);
            return (
              <div key={amenity.id} className="group relative ">
                <div 
                  className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border transition-all duration-500 hover:scale-105 hover:bg-slate-700/50 h-full" 
                  style={{ borderColor: `${colorMedio}30` }}
                >
                  {amenity.image && (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6">
                      <Image
                        src=/*{amenity.image}*/"/smartrotom/img/w2.webp"
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
                      style={{ backgroundColor: `${colorClaro}20` }}
                    >
                      <IconComponent className="w-8 h-8" style={{ color: colorClaro }} />
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
                          style={{ backgroundColor: colorMedio }} 
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