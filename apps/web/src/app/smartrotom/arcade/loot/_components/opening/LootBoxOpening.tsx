import { useSpinnerAnimation } from "../../_hooks/useSpinnerAnimation";
import { BoxAnimation } from "./BoxAnimation";
import { ResultDisplay } from "./ResultDisplayComponent";
import { Spinner } from "./Spinner";
import { LootboxBoxConfig, LootboxItemConfig } from "@boffmedia/shared";

interface LootBoxOpeningProps {
  lootBox: LootboxBoxConfig;
  wonItem: LootboxItemConfig;
  onComplete: () => void;
}

export default function LootBoxOpening({ lootBox, wonItem, onComplete }: LootBoxOpeningProps) {
  const {
    showBox,
    showSpinner,
    animationCompleted,
    spinItems,
    scrollPosition,
    isSpinning,
    spinComplete,
    spinnerRef,
    itemsContainerRef,
    winnerIndex,
    ITEM_WIDTH
  } = useSpinnerAnimation({ lootBox, wonItem });

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] py-8">
      {/* Result display - Arcade Cabinet Style */}
      {animationCompleted && <ResultDisplay wonItem={wonItem} onComplete={onComplete} />}
      
      {/* Box Animation */}
      {showBox && <BoxAnimation lootBox={lootBox} />}
      
      {/* Arcade-Style Spinner */}
      {showSpinner && (
        <Spinner
          lootBox={lootBox}
          spinItems={spinItems}
          scrollPosition={scrollPosition}
          spinComplete={spinComplete}
          isSpinning={isSpinning}
          winningIndex={winnerIndex}
          wonItem={wonItem}
          spinnerRef={spinnerRef}
          itemsContainerRef={itemsContainerRef}
          ITEM_WIDTH={ITEM_WIDTH}
        />
      )}
    </div>
  );
}