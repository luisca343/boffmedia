import { useBaseSpinnerAnimation } from "@/hooks/useBaseSpinnerAnimation";
import { LootboxItemConfig } from "@/generated/api";

interface UseSpinnerAnimationProps {
  lootBox: {
    items: LootboxItemConfig[];
  };
  wonItem: LootboxItemConfig;
}

export function useSpinnerAnimation({ lootBox, wonItem }: UseSpinnerAnimationProps) {
  const result = useBaseSpinnerAnimation({
    items: lootBox.items,
    winner: wonItem,
    itemWidth: 180,
    soundFrequency: 2,
    completionDelay: 800,
    hasBoxAnimation: true,
    boxAnimationDuration: 1500,
    spinStartDelay: 100,
    randomOffsetVariance: 0.98
  });

  return {
    ...result,
    winnerIndex: result.winnerIndex
  };
}