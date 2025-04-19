import { useState, useEffect } from "react";
import { LootBox } from "../../types";
import { InventoryItem } from "@/services/api/smartrotom/arcadeService";
import { getThemeColors } from "../../_utils/getThemeColors";
import { BoxCarousel } from "./BoxCarousel";
import { BoxInfo } from "./BoxInfo";
import { OpenBoxButton } from "./OpenBoxButton";
import { LootBoxOdds } from "../opening/LootBoxOdds";

interface LootBoxSelectorProps {
  lootBoxes: LootBox[];
  selectedBox: LootBox | null;
  onSelect: (box: LootBox) => void;
  onOpenBox: () => void;
  ownedBoxes: Record<string, InventoryItem>;
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
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 pb-2 mb-4">
        Selecciona una Caja
      </h2>
      
      {/* Box Carousel */}
      <BoxCarousel
        lootBoxes={lootBoxes}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        onSelect={onSelect}
        selectedBox={selectedBox || lootBoxes[0]}
        currentBoxTheme={currentBoxTheme}
      />
      
      {/* Box Info */}
      {selectedBox && (
        <BoxInfo
          selectedBox={selectedBox}
          ownedBoxes={ownedBoxes}
          currentBoxTheme={currentBoxTheme}
        />
      )}
      
      {/* View Odds Button */}
      {selectedBox && (
        <button
          onClick={() => setIsOddsModalOpen(true)}
          className={`mt-3 text-sm px-4 py-1 rounded-full border ${currentBoxTheme.text} ${currentBoxTheme.border} transition-colors`}
        >
          Ver Probabilidades
        </button>
      )}
      
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