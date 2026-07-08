"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { BOFF_VARIANTS } from "./boffVariants"
import { useGiveawayAnimation } from "../../_hooks/useGiveawayAnimation"
import Spinner from "./Spinner"

type SpinnerAnimationProps = {
  participants: string[]
  winner: string | null
  onComplete: () => void
}

const boff   = BOFF_VARIANTS.primary;
const yellow = BOFF_VARIANTS.yellow;

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
    ITEM_WIDTH,
  } = useGiveawayAnimation(participants, winner);

  useEffect(() => {
    if (animationCompleted) onComplete();
  }, [animationCompleted, onComplete]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Heading */}
      <div className="text-center">
        <motion.h2
          className="text-2xl font-black"
          style={{
            fontFamily: "Orbitron, sans-serif",
            backgroundImage: spinComplete
              ? `linear-gradient(135deg, ${yellow.text} 0%, #fde68a 50%, ${yellow.text} 100%)`
              : "linear-gradient(135deg, #fde68a 0%, #fb923c 40%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          animate={!spinComplete ? { opacity: [1, 0.65, 1] } : { opacity: 1 }}
          transition={!spinComplete ? { duration: 1.2, repeat: Infinity } : {}}
        >
          {spinComplete ? "¡Tenemos un ganador!" : "¡Sorteando!"}
        </motion.h2>
      </div>

      {/* Spinner with glow ring while spinning */}
      <div
        className="w-full rounded-xl overflow-hidden transition-all duration-500"
        style={{
          boxShadow: !spinComplete && isSpinning
            ? `0 0 0 2px ${boff.border}, 0 0 50px ${boff.glow}`
            : spinComplete
            ? `0 0 0 2px ${yellow.border}, 0 0 50px ${yellow.glow}`
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
  );
}
