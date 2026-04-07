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
      <h2
        className="text-xl font-black mb-8 text-center"
        style={{
          fontFamily: "Orbitron, sans-serif",
          background: "linear-gradient(135deg, #fde68a 0%, #fb923c 40%, #f97316 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
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

      <div className="mt-8 text-center min-h-[28px]">
        {!spinComplete ? (
          <p className="text-surface-400 animate-pulse text-sm tracking-wide">
            Seleccionando ganador...
          </p>
        ) : (
          <p
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: "rgb(251,146,60)", fontFamily: "Orbitron, sans-serif" }}
          >
            ¡Ganador seleccionado!
          </p>
        )}
      </div>
    </div>
  )
}
