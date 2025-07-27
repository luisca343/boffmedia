interface WaveTransitionProps {
  fromColor?: string;
  toColor?: string;
  height?: string;
  variant?: 'smooth' | 'dynamic' | 'layered';
}

export function WaveTransition({ 
  fromColor = "surface-950", 
  toColor = "surface-800", 
  height = "h-24",
  variant = 'smooth'
}: WaveTransitionProps) {
  const getSmoothWave = () => (
    <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
  );

  const getDynamicWave = () => (
    <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,106.7C960,117,1056,139,1152,128C1248,117,1344,75,1392,53.3L1440,32L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" />
  );

  const getLayeredWaves = () => (
    <>
      <path d="M0,64L48,69.3C96,75,192,85,288,90.7C384,96,480,96,576,90.7C672,85,768,75,864,80C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" 
            className={`fill-${toColor}`} opacity="0.6" />
      <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,80C1248,85,1344,75,1392,69.3L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z" 
            className={`fill-${toColor}`} opacity="1" />
    </>
  );

  const getWavePath = () => {
    switch (variant) {
      case 'dynamic': return getDynamicWave();
      case 'layered': return getLayeredWaves();
      default: return getSmoothWave();
    }
  };

  return (
    <div className={`relative w-full ${height} overflow-hidden`}>
      <svg 
        className="absolute bottom-0 w-full h-full" 
        viewBox="0 0 1440 120" 
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {getWavePath()}
      </svg>
    </div>
  );
}