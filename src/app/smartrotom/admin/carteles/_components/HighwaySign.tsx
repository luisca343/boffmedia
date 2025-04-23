import React from 'react'
import { LuArrowDown, LuArrowLeft, LuArrowRight } from 'react-icons/lu'

interface Destination {
  name: string
  distance: string
  direction: 'down' | 'left' | 'right'
}

interface HighwaySignProps {
  highway: string
  destinations: Destination[]
  width: number
  height: number
}

const HighwaySign: React.FC<HighwaySignProps> = ({ highway, destinations, width, height }) => {
  const defaultName = "Pixelmon Wingull"
  const defaultDistance = "69"

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'left':
        return <LuArrowLeft size={height * 0.05} />;
      case 'right':
        return <LuArrowRight size={height * 0.05} />;
      default:
        return <LuArrowDown size={height * 0.05} />;
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #005CA5, #00274F)',
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: `${height * 0.03}px ${width * 0.04}px`,
        fontFamily: '"Roboto Condensed", Arial, sans-serif',
        color: 'white',
        boxSizing: 'border-box',
        borderRadius: '12px',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.25), 0 3px 6px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      {/* Top decorative border */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '6px',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
      
      {/* Highway number badge */}
      <div style={{
        fontSize: `${height * 0.09}px`,
        fontWeight: 'bold',
        marginTop: `${height * 0.02}px`,
        marginBottom: `${height * 0.04}px`,
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        background: 'rgba(255, 255, 255, 0.15)',
        padding: `${height * 0.01}px ${width * 0.05}px`,
        borderRadius: '8px',
        letterSpacing: '1px',
        border: '2px solid rgba(255, 255, 255, 0.25)',
      }}>
        {highway || 'A-1'}
      </div>
      
      {/* Destinations container */}
      <div style={{ 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: `${height * 0.018}px`,
        padding: `0 ${width * 0.01}px`
      }}>
        {destinations.map((dest, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              fontSize: `${height * 0.055}px`,
              padding: `${height * 0.015}px ${width * 0.03}px`,
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.18)',
            }}
          >
            {/* Left side with direction and destination name */}
            <span style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: `${width * 0.02}px`,
              maxWidth: '75%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: `${height * 0.06}px`,
                height: `${height * 0.06}px`,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.18)',
                boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                flexShrink: 0
              }}>
                {getDirectionIcon(dest.direction)}
              </div>
              <span style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>{dest.name || defaultName}</span>
            </span>
            
            {/* Right side with distance */}
            <span style={{ 
              fontWeight: 'bold',
              background: 'rgba(0, 0, 0, 0.2)',
              padding: `${height * 0.01}px ${width * 0.02}px`,
              borderRadius: '4px',
              minWidth: `${width * 0.12}px`,
              textAlign: 'center',
              flexShrink: 0
            }}>{dest.distance || defaultDistance} bq</span>
          </div>
        ))}
      </div>
      
      {/* Bottom decorative border */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '6px',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
      
      {/* Subtle texture overlay */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\' viewBox=\'0 0 4 4\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'0.05\' d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\'%3E%3C/path%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default HighwaySign