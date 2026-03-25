import { FloatingOrb } from "./FloatingOrb";



interface BackgroundDecorationsProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function BackgroundDecorations({ 
  colorClaro, 
  colorMedio, 
  colorOscuro 
}: BackgroundDecorationsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <FloatingOrb 
        color={colorClaro}
        size="large"
        position="top-left"
        opacity={6}
        animationDelay="0s"
      />
      <FloatingOrb 
        color={colorOscuro}
        size="medium"
        position="bottom-right"
        opacity={6}
        animationDelay="2s"
      />
      <FloatingOrb 
        color={colorMedio}
        size="small"
        position="center"
        opacity={4}
        animationDelay="1s"
      />
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `radial-gradient(ellipse at bottom left, ${colorMedio}12 0%, transparent 50%), radial-gradient(ellipse at top right, ${colorOscuro}08 0%, transparent 50%)`
        }}
      />
    </div>
  );
}
