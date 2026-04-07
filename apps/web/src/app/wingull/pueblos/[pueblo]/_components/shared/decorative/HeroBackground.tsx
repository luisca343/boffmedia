interface HeroBackgroundProps {
  townData: any;
  colorClaro: string;
  colorMedio: string;
  colorOscuro: string;
}

export function HeroBackground({ townData, colorClaro, colorMedio, colorOscuro }: HeroBackgroundProps) {
  return (
    <>
      {/* Color overlay */}
      <div className="absolute inset-0" style={{backgroundColor: `${colorClaro}30`}}/>
      
      {/* Background image */}
      {townData.fondo && (
        <div 
          className="absolute inset-0 opacity-40" 
          style={{ 
            backgroundImage: `url(${townData.fondo})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            backgroundAttachment: 'fixed' 
          }} 
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/40" />
      
      {/* Animated gradient */}
      <div 
        className="absolute inset-0 animate-pulse" 
        style={{ 
          background: `radial-gradient(ellipse at center, ${colorClaro}30 0%, transparent 50%), linear-gradient(135deg, ${colorMedio}20 0%, transparent 70%)` 
        }} 
      />
    </>
  );
}
