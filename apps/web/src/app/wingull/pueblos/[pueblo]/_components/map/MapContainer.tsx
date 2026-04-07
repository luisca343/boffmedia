import { ReactNode } from 'react';
import { GradientBar } from '../shared/decorative/GradientBar';
import { DecorativeCorner } from '../shared/decorative/DecorativeCorner';

interface MapContainerProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  children: ReactNode;
}

export function MapContainer({ 
  colorClaro, 
  colorMedio, 
  colorOscuro, 
  children 
}: MapContainerProps) {
  return (
    <div 
      className="relative backdrop-blur-sm rounded-2xl border p-8 shadow-lg text-slate-100 max-w-6xl mx-auto overflow-hidden"
      style={{ background: `${colorMedio}70`, borderColor: colorClaro }}
    >
      <GradientBar 
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
        position="top"
      />
      
      <DecorativeCorner color={colorClaro} position="top-left" />
      <DecorativeCorner color={colorClaro} position="top-right" />

      {children}
    </div>
  );
}
