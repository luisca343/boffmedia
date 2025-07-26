interface FloatingBackgroundProps {
  variant?: 'default' | 'warm' | 'cool'
  showParticles?: boolean
  showBlobs?: boolean
}

export function FloatingBackground({ 
  variant = 'default', 
  showParticles = true, 
  showBlobs = true 
}: FloatingBackgroundProps) {
  const getColorsByVariant = () => {
    switch (variant) {
      case 'warm':
        return {
          primary: '#ef4444', // red-500
          secondary: '#f97316', // orange-500
          accent: '#f59e0b', // amber-500
          gradient1: 'from-red-500/20 to-orange-500/20',
          gradient2: 'from-orange-500/15 to-amber-500/15'
        }
      case 'cool':
        return {
          primary: '#3b82f6', // blue-500
          secondary: '#06b6d4', // cyan-500
          accent: '#14b8a6', // teal-500
          gradient1: 'from-blue-500/20 to-cyan-500/20',
          gradient2: 'from-cyan-500/15 to-teal-500/15'
        }
      default:
        return {
          primary: '#ef4444', // primary-500 (assuming red)
          secondary: '#f97316', // orange-500
          accent: '#f59e0b', // amber-500
          gradient1: 'from-primary-500/20 to-orange-500/20',
          gradient2: 'from-orange-500/15 to-amber-500/15'
        }
    }
  }

  const colors = getColorsByVariant()

  return (
    <>
      {/* Main SVG Background */}
      <div
        className="fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id={`gradient1-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.1" />
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.05" />
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.1" />
            </linearGradient>
            
            <radialGradient id={`radial1-${variant}`} cx="30%" cy="20%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.15" />
              <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </radialGradient>
            
            <radialGradient id={`radial2-${variant}`} cx="70%" cy="80%">
              <stop offset="0%" stopColor={colors.accent} stopOpacity="0.12" />
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
            </radialGradient>

            {/* Filters for blur effects */}
            <filter id="blur1" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" />
            </filter>
            <filter id="blur2" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="60" />
            </filter>
          </defs>

          {/* Background base */}
          <rect width="100%" height="100%" fill="transparent" />

          {/* Organic flowing shapes */}
          <path
            d="M0,400 Q300,200 600,300 T1200,250 L1200,0 L0,0 Z"
            fill={`url(#gradient1-${variant})`}
            opacity="0.3"
          />
          
          <path
            d="M0,600 Q400,400 800,500 T1200,450 L1200,800 L0,800 Z"
            fill={`url(#gradient1-${variant})`}
            opacity="0.2"
          />

          {/* Floating circles with blur */}
          {showBlobs && (
            <>
              <circle
                cx="200"
                cy="150"
                r="100"
                fill={`url(#radial1-${variant})`}
                filter="url(#blur1)"
              />
              <circle
                cx="900"
                cy="600"
                r="150"
                fill={`url(#radial2-${variant})`}
                filter="url(#blur2)"
              />
              <circle
                cx="600"
                cy="400"
                r="80"
                fill={colors.secondary}
                fillOpacity="0.08"
                filter="url(#blur1)"
              />
            </>
          )}

          {/* Connecting lines/paths */}
          <g opacity="0.08" stroke={colors.secondary} strokeWidth="2" fill="none">
            <path d="M0,300 Q300,100 600,200 T1200,150" />
            <path d="M0,500 Q400,300 800,400 T1200,350" />
          </g>
        </svg>
      </div>

      {/* Additional animated particles */}
      {showParticles && (
        <div
          className="fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <div 
            className="absolute w-2 h-2 rounded-full opacity-20 animate-pulse"
            style={{
              top: '20%', 
              left: '10%', 
              backgroundColor: colors.primary,
              animationDelay: '0s',
              animationDuration: '3s'
            }}
          />
          <div 
            className="absolute w-1 h-1 rounded-full opacity-30 animate-pulse"
            style={{
              top: '60%', 
              left: '80%', 
              backgroundColor: colors.secondary,
              animationDelay: '1s',
              animationDuration: '4s'
            }}
          />
          <div 
            className="absolute w-3 h-3 rounded-full opacity-15 animate-pulse"
            style={{
              top: '80%', 
              left: '20%', 
              backgroundColor: colors.accent,
              animationDelay: '2s',
              animationDuration: '5s'
            }}
          />
          <div 
            className="absolute w-2 h-2 rounded-full opacity-25 animate-pulse"
            style={{
              top: '40%', 
              left: '90%', 
              backgroundColor: colors.secondary,
              animationDelay: '1.5s',
              animationDuration: '3.5s'
            }}
          />
        </div>
      )}
    </>
  )
}