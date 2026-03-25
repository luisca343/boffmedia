import { ReactNode } from 'react';
import { GradientBar } from '../decorative/GradientBar';

interface BasicCardProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  children: ReactNode;
  className?: string;
}

export function BasicCard({ 
  colorClaro, 
  colorMedio, 
  colorOscuro, 
  children, 
  className = '' 
}: BasicCardProps) {
  return (
    <div className="group relative">
      <div 
        className={`relative backdrop-blur-sm rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg text-slate-100 ${className}`}
        style={{ background: `${colorMedio}70`, borderColor: colorClaro }}
      >
        <GradientBar 
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
        />

        {children}
        
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"
          style={{ 
            background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
          }}
        />
      </div>
    </div>
  );
}
