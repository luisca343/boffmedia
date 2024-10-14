import React from 'react'

interface PopArtWallpaperProps {
  width?: number;
  height?: number;
}

export default function PopArtWallpaper({ width = 1920, height = 1080 }: PopArtWallpaperProps) {
  const mainColor = '#FF69B4'  // Hot Pink
  const accentColors = ['#FF1493', '#FF00FF', '#FFB6C1', '#FFC0CB', '#FF4500', '#FFFF00']

  const generateBackground = () => (
    <rect width={width} height={height} fill={mainColor} />
  )

  const generateHalftone = () => {
    const dots = []
    const dotSpacing = 30
    for (let y = 15; y < height; y += dotSpacing) {
      for (let x = 15; x < width; x += dotSpacing) {
        const distanceToCenter = Math.sqrt(Math.pow(x - width/2, 2) + Math.pow(y - height/2, 2))
        const maxDistance = Math.sqrt(Math.pow(width/2, 2) + Math.pow(height/2, 2))
        const size = 10 * (1 - distanceToCenter / maxDistance)
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
    return dots
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
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        {generateBackground()}
        {generateHalftone()}
      </svg>
    </div>
  )
}