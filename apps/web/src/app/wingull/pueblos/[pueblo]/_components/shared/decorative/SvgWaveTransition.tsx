interface SvgWaveTransitionProps {
  colorMedio: string;
  colorOscuro: string;
  position?: 'top' | 'bottom';
  height?: string;
}

export function SvgWaveTransition({ 
  colorMedio, 
  colorOscuro, 
  position = 'top',
  height = '80px' 
}: SvgWaveTransitionProps) {
  const paths = position === 'top' 
    ? {
        primary: "M0,40 C480,0 960,80 1440,40 L1440,0 L0,0 Z",
        secondary: "M0,60 C480,20 960,100 1440,60 L1440,0 L0,0 Z"
      }
    : {
        primary: "M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z",
        secondary: "M0,65 C480,75 960,45 1440,65 L1440,80 L0,80 Z"
      };

  return (
    <div 
      className={`absolute left-0 right-0 ${position}-0 z-20 pointer-events-none`} 
      style={{ height }}
    >
      <svg 
        viewBox="0 0 1440 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="none" 
        width="100%" 
        height="80"
      >
        <path d={paths.primary} fill={colorMedio} opacity="0.08" />
        <path d={paths.secondary} fill={colorOscuro} opacity="0.05" />
      </svg>
    </div>
  );
}
