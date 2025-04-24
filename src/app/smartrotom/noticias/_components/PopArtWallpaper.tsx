import React, { useEffect, useRef } from 'react'

interface PopArtWallpaperProps {
  width?: number;
  height?: number;
}

export default function PopArtWallpaper({ width = 1920, height = 1080 }: PopArtWallpaperProps) {
  const mainColor = '#FF69B4'  // Hot Pink
  const accentColors = ['#FF1493', '#FF00FF', '#FFB6C1', '#FFC0CB', '#FF4500', '#FFFF00']
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    // Animate dots for a more dynamic feel
    const dots = svgRef.current?.querySelectorAll('circle');
    if (!dots) return;
    
    dots.forEach((dot, index) => {
      const delay = index % 5 * 0.2;
      const animation = dot.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.2)' },
        { transform: 'scale(1)' }
      ], {
        duration: 3000 + Math.random() * 2000,
        delay: delay * 1000,
        iterations: Infinity
      });
    });
  }, []);

  const generateBackground = () => (
    <rect width={width} height={height} fill={mainColor} />
  )
  
  // Create Ben-Day dot pattern (classic Pop Art style)
  const generateHalftone = () => {
    const dots = []
    const dotSpacing = 40
    for (let y = 20; y < height; y += dotSpacing) {
      for (let x = 20; x < width; x += dotSpacing) {
        const distanceToCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2))
        const maxDistance = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2))
        const size = 12 * (1 - distanceToCenter / maxDistance)
        dots.push(
          <circle
            key={`halftone-${x}-${y}`}
            cx={x}
            cy={y}
            r={size}
            fill={accentColors[Math.floor(Math.random() * accentColors.length)]}
          />
        )
      }
    }
    
    // Add some Roy Lichtenstein style comic book dots
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 40 + Math.random() * 60;
      dots.push(
        <circle
          key={`comic-dot-${i}`}
          cx={x}
          cy={y}
          r={size}
          fill={accentColors[Math.floor(Math.random() * accentColors.length)]}
          opacity="0.7"
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
      overflow: 'hidden'
    }}>
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="xMidYMid slice"
      >
        {generateBackground()}
        {/*generateHalftone()*/}
        {/* Add comic style "POW!" shapes */}
        <path d="M200,300 L280,220 L300,290 L380,270 L340,350 L400,400 L320,420 L300,500 L250,450 L180,480 L220,400 L150,350 Z" 
          fill="#FFFF00" stroke="#000" strokeWidth="5" opacity="0.8" />
        <text x="280" y="380" fontFamily="Bangers" fontSize="30" fill="#000">POW!</text>
        
        <path d="M1600,600 L1680,520 L1700,590 L1780,570 L1740,650 L1800,700 L1720,720 L1700,800 L1650,750 L1580,780 L1620,700 L1550,650 Z" 
          fill="#FF4500" stroke="#000" strokeWidth="5" opacity="0.8" />
        <text x="1660" y="680" fontFamily="Bangers" fontSize="30" fill="#000">BAM!</text>
      </svg>
    </div>
  )
}