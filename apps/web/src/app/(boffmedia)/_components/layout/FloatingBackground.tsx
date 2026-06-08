interface FloatingBackgroundProps {
  variant?: 'default' | 'warm' | 'cool';
  showParticles?: boolean;
  showBlobs?: boolean;
  className?: string;
}

export function FloatingBackground({
  variant = 'default',
  showBlobs = false,
  className = ""
}: FloatingBackgroundProps) {
  const getColorsByVariant = () => {
    switch (variant) {
      case 'warm':
        return {
          primary: '#ef4444', // red-500
          secondary: '#f97316', // orange-500
          accent: '#f59e0b', // amber-500
        };
      case 'cool':
        return {
          primary: '#3b82f6', // blue-500
          secondary: '#06b6d4', // cyan-500
          accent: '#14b8a6', // teal-500
        };
      default:
        return {
          primary: '#ef4444', // primary-500
          secondary: '#f97316', // orange-500
          accent: '#f59e0b', // amber-500
        };
    }
  };

  const colors = getColorsByVariant();

  return (
    <>
      {/* Main SVG Background - full width, repeat only vertically */}
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
        style={{ 
          zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="gradient1-${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.1" />
                  <stop offset="50%" stop-color="${colors.secondary}" stop-opacity="0.05" />
                  <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0.1" />
                </linearGradient>
                <radialGradient id="radial1-${variant}" cx="30%" cy="20%">
                  <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.15" />
                  <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0" />
                </radialGradient>
                <radialGradient id="radial2-${variant}" cx="70%" cy="80%">
                  <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.12" />
                  <stop offset="100%" stop-color="${colors.accent}" stop-opacity="0" />
                </radialGradient>
                <filter id="blur1-${variant}">
                  <feGaussianBlur stdDeviation="40" />
                </filter>
                <filter id="blur2-${variant}">
                  <feGaussianBlur stdDeviation="60" />
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="transparent" />
              <path d="M0,400 Q300,200 600,300 T1200,250 L1200,0 L0,0 Z" fill="url(#gradient1-${variant})" opacity="0.3" />
              <path d="M0,600 Q400,400 800,500 T1200,450 L1200,800 L0,800 Z" fill="url(#gradient1-${variant})" opacity="0.2" />

              <g opacity="0.08" stroke="${colors.secondary}" stroke-width="2" fill="none">
                <path d="M0,300 Q300,100 600,200 T1200,150" />
                <path d="M0,500 Q400,300 800,400 T1200,350" />
              </g>
            </svg>
          `)}")`,
          backgroundAttachment: 'fixed',
          backgroundSize: '100% auto',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center'
        }}
      />
      {showBlobs && (
        <>
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${colors.primary}26 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${colors.accent}20 0%, transparent 70%)`,
              filter: 'blur(60px)',
            }}
          />
        </>
      )}
    </>
  );
}