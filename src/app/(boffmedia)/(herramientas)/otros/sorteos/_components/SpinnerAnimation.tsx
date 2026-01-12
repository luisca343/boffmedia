"use client"

import { useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useGiveawayAnimation } from "../_hooks/useGiveawayAnimation"
import Spinner from "./Spinner"

type SpinnerAnimationProps = {
  participants: string[]
  winner: string | null
  onComplete: () => void
}

export default function SpinnerAnimation({ participants, winner, onComplete }: SpinnerAnimationProps) {
  const t = useTranslations('boffmedia');
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
  )
}