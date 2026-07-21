"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { useGiveawayAnimation } from "../../_hooks/useGiveawayAnimation"
import Spinner from "./Spinner"

type SpinnerAnimationProps = {
  participants: string[]
  winner: string | null
  onComplete: () => void
}

export default function SpinnerAnimation({ participants, winner, onComplete }: SpinnerAnimationProps) {
  const t = useTranslations("otros.sorteosApp")
  const {
    spinItems,
    scrollPosition,
    isSpinning,
    spinComplete,
    animationCompleted,
    winnerIndex,
    spinnerRef,
    itemsContainerRef,
    ITEM_WIDTH,
  } = useGiveawayAnimation(participants, winner)

  useEffect(() => {
    if (animationCompleted) onComplete()
  }, [animationCompleted, onComplete])

  return (
    <div className="flex flex-col items-center gap-5">
      {/* stage heading — «voz de la señal»: heavy italic uppercase */}
      <h2
        className={
          "font-display text-2xl font-extrabold italic uppercase leading-none tracking-[0.01em] transition-colors " +
          (spinComplete
            ? "text-accent"
            : "animate-[bm-pulse_1.2s_ease-in-out_infinite] text-accent-bright motion-reduce:animate-none")
        }
      >
        {spinComplete ? t("spinnerTenemosGanador") : t("spinnerSorteando")}
      </h2>

      {/* spinner with accent glow ring while live */}
      <div
        className="w-full transition-all duration-500"
        style={{
          boxShadow:
            !spinComplete && isSpinning
              ? "0 0 50px color-mix(in srgb, var(--accent) 14%, transparent)"
              : spinComplete
                ? "0 0 50px color-mix(in srgb, var(--accent) 18%, transparent)"
                : "none",
        }}
      >
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
      </div>
    </div>
  )
}
