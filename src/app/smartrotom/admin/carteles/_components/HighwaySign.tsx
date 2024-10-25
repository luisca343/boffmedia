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
        return <LuArrowLeft />;
      case 'right':
        return <LuArrowRight />;
      default:
        return <LuArrowDown />;
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #0057A5, #003366)',
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        color: 'white',
        boxSizing: 'border-box',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '5px',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
        }}
      />
      <div style={{
        fontSize: `${height * 0.12}px`,
        fontWeight: 'bold',
        marginBottom: `${height * 0.05}px`,
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }}>
        {highway || 'A-1'}
      </div>
      {destinations.map((dest, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            fontSize: `${height * 0.08}px`,
            marginBottom: `${height * 0.025}px`,
            padding: '5px 10px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '5px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {getDirectionIcon(dest.direction)}
            <span style={{ marginLeft: '10px' }}>{dest.name || defaultName}</span>
          </span>
          <span style={{ fontWeight: 'bold' }}>{dest.distance || defaultDistance} bq</span>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          height: '5px',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
        }}
      />
    </div>
  )
}

export default HighwaySign