import React from 'react'
import GlitchStyles from './GlitchStyles'
import MatrixRain from './MatrixRain'
import Scanline from './ScanLine'
import Vignette from './Vignette'
import GridBackground from './GridBackground'

export default function TerminalDecorations() {
  return (
    <>
      {/* Decoration Elements */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none overflow-hidden">
        {/* Grid background - lowest z-index */}
        <GridBackground />
        
        {/* Matrix rain columns - middle z-index */}
        <MatrixRain />
        
        {/* Enhanced visual effects */}
        <Scanline />
        <Vignette />
      </div>
      
      <GlitchStyles />
    </>
  )
}