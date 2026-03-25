import React, { useEffect, useRef } from 'react'

interface PopArtWallpaperProps {
  width?: number;
  height?: number;
}

export default function PopArtWallpaper({ width = 1920, height = 1080 }: PopArtWallpaperProps) {
  const mainColor = '#FF69B4'  // Hot Pink
  const accentColors = ['#FFD700', '#FF1493', '#00CED1', '#32CD32']
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    const dots = svgRef.current?.querySelectorAll('circle');
    if (!dots) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;
    
    dots.forEach((dot, index) => {
      const delay = index % 10 * 0.5;
      dot.animate([
        { transform: 'scale(1)', opacity: '0.6' },
        { transform: 'scale(1.1)', opacity: '0.8' },
        { transform: 'scale(1)', opacity: '0.6' }
      ], {
        duration: 4000 + Math.random() * 2000,
        delay: delay * 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
      });
    });
  }, []);

  const generateBackground = () => (
    <rect width={width} height={height} fill={mainColor} />
  )
  
  const generateHalftone = () => {
    const dots = []
    const dotSpacing = 60
    
    for (let y = 30; y < height; y += dotSpacing) {
      for (let x = 30; x < width; x += dotSpacing) {
        const distanceToCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2))
        const maxDistance = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2))
        const size = 8 * (1 - distanceToCenter / maxDistance)
        
        if (size > 2) {
          dots.push(
            <circle
              key={`halftone-${x}-${y}`}
              cx={x}
              cy={y}
              r={size}
              fill="rgba(0, 0, 0, 0.1)"
            />
          )
        }
      }
    }
    
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 20 + Math.random() * 30;
      dots.push(
        <circle
          key={`accent-dot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={accentColors[i % accentColors.length]}
          opacity="0.4"
        />
      );
    }
    
    return dots;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{ pointerEvents: 'none' }}
      >
        {generateBackground()}
        {generateHalftone()}
        
        <path 
          d="M200,400 L280,320 L300,390 L380,370 L340,450 L280,480 L220,450 Z" 
          fill="rgba(255, 255, 0, 0.6)" 
          stroke="rgba(0, 0, 0, 0.3)" 
          strokeWidth="2" 
        />
        <text 
          x="280" 
          y="420" 
          fontFamily="Bangers" 
          fontSize="24" 
          fill="rgba(0, 0, 0, 0.7)"
          textAnchor="middle"
        >
          NOTICIAS!
        </text>
        
        <path 
          d="M1500,700 L1580,620 L1600,690 L1680,670 L1640,750 L1580,780 L1520,750 Z" 
          fill="rgba(0, 206, 209, 0.6)" 
          stroke="rgba(0, 0, 0, 0.3)" 
          strokeWidth="2" 
        />
        <text 
          x="1600" 
          y="720" 
          fontFamily="Bangers" 
          fontSize="24" 
          fill="rgba(0, 0, 0, 0.7)"
          textAnchor="middle"
        >
          CA-MI-NAR!
        </text>
      </svg>
    </div>
  )
}