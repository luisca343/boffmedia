"use client"

import { useEffect } from "react"
import { useGiveawayAnimation } from "../_hooks/useGiveawayAnimation"
import Spinner from "./Spinner"

type SpinnerAnimationProps = {
  participants: string[]
  winner: string | null
  onComplete: () => void
}

export default function SpinnerAnimation({ participants, winner, onComplete }: SpinnerAnimationProps) {
  const {
    spinItems,
    scrollPosition,
    isSpinning,
    spinComplete,
    animationCompleted,
    winnerIndex,
    spinnerRef,
    itemsContainerRef,
    ITEM_WIDTH
  } = useGiveawayAnimation(participants, winner)
  
  useEffect(() => {
    if (animationCompleted) {
      onComplete()
    }
  }, [animationCompleted, onComplete])
  
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
        ¡Sorteando!
      </h2>
      
      <Spinner 
        spinItems={spinItems}
        scrollPosition={scrollPosition}
        isSpinning={isSpinning}
        spinComplete={spinComplete}
        winnerIndex={winnerIndex}
        spinnerRef={spinnerRef}
        itemsContainerRef={itemsContainerRef}
        ITEM_WIDTH={ITEM_WIDTH}
      />
      
      <div className="mt-8 text-center text-surface-300 min-h-[28px]">
        {!spinComplete ? (
          <p className="animate-pulse">Seleccionando ganador...</p>
        ) : (
          <p className="text-primary-400 font-semibold">¡Ganador seleccionado!</p>
        )}
      </div>
    </div>
  )
}