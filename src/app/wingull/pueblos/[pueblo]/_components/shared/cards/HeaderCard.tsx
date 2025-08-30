import { ReactNode } from 'react';
import { GradientBar } from '../decorative/GradientBar';
import { DecorativeCorner } from '../decorative/DecorativeCorner';
import { OrnamentalDots } from '../decorative/OrnamentalDots';
import { DecorativeDivider } from '../decorative/DecorativeDivider';
import { FloatingAccent } from '../decorative/FloatingAccent';

interface HeaderCardProps {
  title: ReactNode;
  subtitle: ReactNode;
  description: ReactNode;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  townName: string;
}

export function HeaderCard({ 
  title, 
  subtitle, 
  description, 
  colorClaro, 
  colorMedio, 
  colorOscuro,
  townName 
}: HeaderCardProps) {
  return (
    <div className="relative max-w-4xl w-full">
      <div 
        className="relative backdrop-blur-sm rounded-2xl p-8 lg:p-10 border shadow-lg transform hover:scale-[1.02] transition-all duration-300 text-slate-100 overflow-hidden"
        style={{ background: `${colorOscuro}70`, borderColor: `${colorMedio}30` }}
      >
        <GradientBar 
          colorClaro={colorClaro}
          colorMedio={colorMedio}
          colorOscuro={colorOscuro}
          position="top"
        />
        
        <DecorativeCorner color={colorClaro} position="top-left" />
        <DecorativeCorner color={colorClaro} position="top-right" />
        <DecorativeCorner color={colorMedio} position="bottom-left" />
        <DecorativeCorner color={colorMedio} position="bottom-right" />
        
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
          <OrnamentalDots 
            colorClaro={colorClaro}
            colorMedio={colorMedio}
            colorOscuro={colorOscuro}
            size="large"
          />
        </div>
        
        <div className="text-center space-y-6 pt-6">
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              {title}
              <br />
              {subtitle}
            </h2>
          </div>
          
          <DecorativeDivider colorClaro={colorClaro} colorMedio={colorMedio} />
          
          <div className="max-w-3xl mx-auto">
            <p className="text-base lg:text-lg leading-relaxed" style={{color: colorMedio}}>
              {typeof description === 'string' ? description.replace('{townName}', townName) : description}
            </p>
          </div>
        </div>
        
        <div className="flex justify-center mt-6 pt-4 border-t border-gray-200/50 dark:border-slate-700/50">
          <OrnamentalDots 
            colorClaro={colorClaro}
            colorMedio={colorMedio}
            colorOscuro={colorOscuro}
            size="medium"
          />
        </div>
        
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-5 transition-opacity duration-300 pointer-events-none"
          style={{ 
            background: `linear-gradient(135deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)`
          }}
        />
      </div>
      
      <FloatingAccent color={colorClaro} size="large" position="top-left" opacity={60} />
      <FloatingAccent color={colorMedio} size="medium" position="top-right" opacity={50} />
      <FloatingAccent color={colorOscuro} size="large" position="bottom-left" opacity={40} />
      <FloatingAccent color={colorMedio} size="small" position="bottom-right" opacity={70} />
    </div>
  );
}
