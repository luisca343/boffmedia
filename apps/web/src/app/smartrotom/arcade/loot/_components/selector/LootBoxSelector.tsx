import { useState, useEffect } from "react";
import { getThemeColors } from "../../_utils/getThemeColors";
import { BoxCarousel } from "./BoxCarousel";
import { BoxInfo } from "./BoxInfo";
import { OpenBoxButton } from "./OpenBoxButton";
import { LootBoxOdds } from "../opening/LootBoxOdds";
import { ArcadeInventoryItem, LootboxBoxConfig } from "@boffmedia/shared";

interface LootBoxSelectorProps {
  lootBoxes: LootboxBoxConfig[];
  selectedBox: LootboxBoxConfig | null;
  onSelect: (box: LootboxBoxConfig) => void;
  onOpenBox: () => void;
  ownedBoxes: Record<string, ArcadeInventoryItem>;
}

export default function LootBoxSelector({ 
  lootBoxes, 
  selectedBox, 
  onSelect, 
  onOpenBox,
  ownedBoxes
}: LootBoxSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOddsModalOpen, setIsOddsModalOpen] = useState(false);
  
  // If no selection yet, select first box
  useEffect(() => {
    if (!selectedBox && lootBoxes.length > 0) {
      onSelect(lootBoxes[0]);
    }
  }, [selectedBox, lootBoxes, onSelect]);
  
  const currentBoxTheme = selectedBox 
    ? getThemeColors(selectedBox.theme) 
    : getThemeColors('blue');

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-accent-400 pb-2 mb-4">
        Selecciona una Caja
      </h2>
      
      {/* Box Carousel */}
      <BoxCarousel
        lootBoxes={lootBoxes}
        currentIndex={currentIndex}
        ownedBoxes={ownedBoxes}
        setCurrentIndex={setCurrentIndex}
        onSelect={onSelect}
        selectedBox={selectedBox || lootBoxes[0]}
        currentBoxTheme={currentBoxTheme}
        onShowOdds={() => setIsOddsModalOpen(true)}
      />
      
      {/* Open Box Button */}
      <div className="mt-6">
        <OpenBoxButton
          selectedBox={selectedBox}
          ownedBoxes={ownedBoxes}
          currentBoxTheme={currentBoxTheme}
          onOpenBox={onOpenBox}
        />
      </div>
      
      {/* Odds Modal */}
      {isOddsModalOpen && selectedBox && (
        <LootBoxOdds
          lootBox={selectedBox}
          currentBoxTheme={currentBoxTheme}
          onClose={() => setIsOddsModalOpen(false)}
        />
      )}
    </div>
  );
}