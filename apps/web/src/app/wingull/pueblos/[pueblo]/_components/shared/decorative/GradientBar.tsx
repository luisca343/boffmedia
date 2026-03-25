interface GradientBarProps {
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
  position?: 'top' | 'bottom';
  height?: string;
  className?: string;
}

export function GradientBar({ 
  colorClaro, 
  colorMedio, 
  colorOscuro, 
  position = 'top',
  height = '1',
  className = ''
}: GradientBarProps) {
  const positionClass = position === 'top' ? 'top-0 rounded-t-2xl' : 'bottom-0 rounded-b-2xl';
  
  return (
    <div 
      className={`absolute left-0 right-0 ${positionClass} h-${height} ${className}`}
      style={{ 
        background: `linear-gradient(90deg, ${colorClaro} 0%, ${colorMedio} 50%, ${colorOscuro} 100%)` 
      }}
    />
  );
}
