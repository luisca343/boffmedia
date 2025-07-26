"use client"

import { useBaseSpinnerAnimation } from "@/hooks/useBaseSpinnerAnimation";

export function useGiveawayAnimation(participants: string[], winner: string | null) {
  return useBaseSpinnerAnimation({
    items: participants,
    winner,
    itemWidth: 200,
    soundFrequency: 5,
    completionDelay: 1500,
    hasBoxAnimation: false,
    spinStartDelay: 500,
    randomOffsetVariance: 0.5
  });
}