import { useMemo, useRef, useEffect } from "react";
import { LootBox } from "../../types";
import { calculateLootBoxOdds } from "../../_utils/calculateLootboxOdds";
import { useTranslations } from "next-intl";
import { getItemName } from "@/lib/intlUtils";
import { ItemImage } from "@/lib/ItemImage";

interface LootBoxOddsProps {
  lootBox: LootBox;
  currentBoxTheme: {
    bgGradient: string;
    border: string;
    text: string;
    highlight: string;
    buttonGradient: string;
    buttonHover: string;
  };
  onClose: () => void;
}

export function LootBoxOdds({ lootBox, currentBoxTheme, onClose }: LootBoxOddsProps) {
  const t = useTranslations('');
  const modalRef = useRef<HTMLDivElement>(null);
  
  const itemsWithOdds = useMemo(() => {
    return calculateLootBoxOdds(lootBox.items);
  }, [lootBox.items]);

  // Sort items by rarity (highest percentage first)
  const sortedItems = useMemo(() => {
    return [...itemsWithOdds].sort((a, b) => b.percentage - a.percentage);
  }, [itemsWithOdds]);

  // Handle clicks outside the modal content
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className={`bg-gray-900 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto ${currentBoxTheme.border}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${currentBoxTheme.highlight}`}>
            {lootBox.name} - Probabilidades
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ItemImage
                    itemId={item.id}
                    size={32}
                />
                <span className="text-white">{getItemName(t, item.id)}</span>
              </div>
              <span className={`font-mono font-medium ${currentBoxTheme.highlight}`}>
                {item.percentage.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-gray-400 text-sm mt-4">
          Las probabilidades son calculadas basadas en los pesos de cada item dentro de la caja.
        </p>
      </div>
    </div>
  );
}