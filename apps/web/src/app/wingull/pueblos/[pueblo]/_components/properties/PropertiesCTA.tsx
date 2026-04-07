import React from "react";

interface PropertiesCTAProps {
  townName: string;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function PropertiesCTA({ townName, colorClaro, colorMedio, colorOscuro }: PropertiesCTAProps) {
  return (
    <div className="relative backdrop-blur-sm rounded-2xl border overflow-hidden shadow-lg mx-auto max-w-2xl p-8" style={{ background: `${colorMedio}70`, borderColor: colorClaro }}>
      {/* Decorative accent bar using town colors */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }} />

      {/* Corner accents */}
      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 rounded-tl-xl opacity-70" style={{ borderColor: colorClaro }} />
      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 rounded-tr-xl opacity-70" style={{ borderColor: colorClaro }} />

      {/* Title */}
      <h3 className="text-2xl lg:text-3xl font-bold mb-4" style={{ color: colorClaro }}>
        ¿No encuentras lo que buscas?
      </h3>
      <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: colorMedio }}>
        Nuestro equipo puede ayudarte a encontrar la parcela perfecta o informarte sobre futuras disponibilidades en Pueblo {townName}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          className="px-6 py-3 rounded-xl border-2 font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
          style={{ borderColor: colorClaro, color: colorClaro, backgroundColor: `${colorClaro}10` }}
        >
          Contactar Agente
        </button>
        <button 
          className="px-6 py-3 rounded-xl font-medium border transition-all duration-300 hover:scale-105"
          style={{ background: `${colorOscuro}10`, color: colorMedio, borderColor: colorMedio }}
        >
          Ver Más Pueblos
        </button>
      </div>

      {/* Subtle glow effect on hover using town colors */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` }}
      />
    </div>
  );
}
