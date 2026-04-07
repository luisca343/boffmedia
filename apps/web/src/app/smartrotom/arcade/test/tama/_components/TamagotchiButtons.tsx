import React from 'react'

type TamagotchiButtonsProps = {
  onButtonPress: (button: 'A' | 'B' | 'C') => void
}

export function TamagotchiButtons({ onButtonPress }: TamagotchiButtonsProps) {
  return (
    <div className="flex justify-between w-64 relative z-20">
      <button onClick={() => onButtonPress('A')} className="w-12 h-12 bg-gradient-to-b from-red-400 to-red-600 rounded-full border-2 border-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-lg transform transition-transform active:scale-95 relative overflow-hidden" aria-label="A">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.3)_0%,_rgba(255,255,255,0)_70%)]"></div>
      </button>
      <button onClick={() => onButtonPress('B')} className="w-12 h-12 bg-gradient-to-b from-secondary-400 to-secondary-600 rounded-full border-2 border-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 shadow-lg transform transition-transform active:scale-95 relative overflow-hidden" aria-label="B">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.3)_0%,_rgba(255,255,255,0)_70%)]"></div>
      </button>
      <button onClick={() => onButtonPress('C')} className="w-12 h-12 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full border-2 border-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 shadow-lg transform  transition-transform active:scale-95 relative overflow-hidden" aria-label="C">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.3)_0%,_rgba(255,255,255,0)_70%)]"></div>
      </button>
    </div>
  )
}