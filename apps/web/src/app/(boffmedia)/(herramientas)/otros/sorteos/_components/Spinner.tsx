"use client"

import SpinnerItem from "./SpinnerItem"

interface SpinnerProps {
  spinItems: string[]
  scrollPosition: number
  isSpinning: boolean
  spinComplete: boolean
  winnerIndex: number | null
  spinnerRef: React.RefObject<HTMLDivElement | null>
  itemsContainerRef: React.RefObject<HTMLDivElement | null>
  ITEM_WIDTH: number
}

export default function Spinner({ 
  spinItems,
  scrollPosition,
  isSpinning,
  spinComplete,
  winnerIndex,
  spinnerRef,
  itemsContainerRef,
  ITEM_WIDTH
}: SpinnerProps) {
  return (
    <div className="relative w-full max-w-3xl">
      <div className="bg-surface-900/90 border-4 border-primary-500/50 rounded-xl overflow-hidden p-4 shadow-2xl">
        <div className="bg-gradient-to-r from-surface-800 to-surface-900 py-2 px-4 mb-4 border-2 border-primary-400/30 rounded-t-lg text-center">
          <h3 className="text-xl font-bold text-primary-400">Ruleta del Sorteo</h3>
        </div>
      
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-500/5 to-transparent opacity-20 animate-scanline pointer-events-none z-30"></div>

        <div
          ref={spinnerRef}
          className="relative h-64 overflow-hidden bg-surface-900/80 backdrop-blur-sm border-4 border-primary-500/30 rounded-lg"
        >
          <div
            ref={itemsContainerRef}
            className="absolute inset-y-0 left-0 flex items-center h-full transition-transform"
            style={{
              transform: `translateX(${-scrollPosition}px)`,
              transition: spinComplete ? 'transform 0.5s ease-out' : 'none'
            }}
          >
            {spinItems.map((name, index) => (
              <SpinnerItem
                key={`${name}-${index}`}
                name={name}
                index={index}
                isWinningItem={winnerIndex === index}
                spinComplete={spinComplete}
              />
            ))}
          </div>

          <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-surface-900 to-transparent z-20 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-surface-900 to-transparent z-20 pointer-events-none" />

          {/* Center marker — triangles pointing inward from top and bottom */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 z-40
            border-l-[10px] border-l-transparent
            border-r-[10px] border-r-transparent
            border-t-[14px] border-t-primary-400" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 z-40
            border-l-[10px] border-l-transparent
            border-r-[10px] border-r-transparent
            border-b-[14px] border-b-primary-400" />
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-0.5 bg-primary-400/40 z-30 pointer-events-none" />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse"></div>
          <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="h-3 w-3 rounded-full bg-primary-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  )
}