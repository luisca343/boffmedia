import { ReactNode } from 'react';
import { BackgroundDecorations } from '../decorative/BackgroundDecorations';
import { SvgWaveTransition } from '../decorative/SvgWaveTransition';

interface SectionTemplateProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  children: ReactNode;
  showTopWave?: boolean;
  showBottomWave?: boolean;
  backgroundGradient?: string;
}

export function SectionTemplate({ 
  colorClaro, 
  colorMedio, 
  colorOscuro, 
  children,
  showTopWave = true,
  showBottomWave = false,
  backgroundGradient = "bg-transparent"
}: SectionTemplateProps) {
  return (
    <section className={`relative overflow-hidden ${backgroundGradient}`}>
      <BackgroundDecorations 
        colorClaro={colorClaro}
        colorMedio={colorMedio}
        colorOscuro={colorOscuro}
      />

      <div className="relative z-10 mx-auto px-6 py-24">
        {children}
      </div>
    </section>
  );
}
