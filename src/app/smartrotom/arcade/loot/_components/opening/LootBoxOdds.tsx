import { useMemo, useRef, useEffect } from "react";
import { LootBox } from "../../types";
import { useTranslations } from "next-intl";
import { getItemName } from "@/lib/intlUtils";
import { ItemImage } from "@/lib/ItemImage";
import { calculateLootBoxOdds } from "../../_utils/calculateLootBoxOdds";
import { LootboxBoxConfig } from "@/generated/api";

interface LootBoxOddsProps {
  lootBox: LootboxBoxConfig;
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

  // Group items by rarity
  const itemsByRarity = useMemo(() => {
    const rarityGroups: Record<string, typeof itemsWithOdds> = {};
    
    itemsWithOdds.forEach(item => {
      const rarity = item.weight || 'common';
      if (!rarityGroups[rarity]) {
        rarityGroups[rarity] = [];
      }
      rarityGroups[rarity].push(item);
    });
    
    // Sort each rarity group by percentage (highest first)
    Object.keys(rarityGroups).forEach(rarity => {
      rarityGroups[rarity].sort((a, b) => b.percentage - a.percentage);
    });
    
    return rarityGroups;
  }, [itemsWithOdds]);
  
  // Calculate aggregate probabilities for each rarity
  const rarityProbabilities = useMemo(() => {
    const probabilities: Record<string, number> = {};
    
    Object.entries(itemsByRarity).forEach(([rarity, items]) => {
      probabilities[rarity] = items.reduce((sum, item) => sum + item.percentage, 0);
    });
    
    return probabilities;
  }, [itemsByRarity]);

  // Get sorted rarity keys (customize order as needed)
  const rarityOrder = useMemo(() => {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary']; 
    return Object.keys(itemsByRarity).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }, [itemsByRarity]);

  // Get display name for rarity
  const getRarityDisplayName = (rarity: string): string => {
    const rarityNames: Record<string, string> = {
      common: t('items.rarity.common'),
      uncommon: t('items.rarity.uncommon'),
      rare: t('items.rarity.rare'),
      epic: t('items.rarity.epic'),
      legendary: t('items.rarity.legendary'),
    };
    
    return rarityNames[rarity] || rarity.charAt(0).toUpperCase() + rarity.slice(1);
  };

  // Get color class for rarity
  const getRarityColorClass = (rarity: string): string => {
    const rarityColors: Record<string, string> = {
      common: 'text-gray-200',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400',
    };
    
    return rarityColors[rarity] || currentBoxTheme.text;
  };

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
        className={`bg-gray-900 rounded-xl p-5 w-full max-w-4xl max-h-[85vh] overflow-y-auto ${currentBoxTheme.border}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-bold ${currentBoxTheme.highlight}`}>
            {lootBox.name} - Probabilidades
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        {/* Rarity Groups Section - Compact Layout */}
        <div className="space-y-4">
          {rarityOrder.map(rarity => (
            <div key={rarity} className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-1.5 mb-2.5">
                <h4 className={`font-medium ${getRarityColorClass(rarity)}`}>
                  {getRarityDisplayName(rarity)}
                </h4>
                <div className="flex items-center">
                  <span className={`font-mono font-medium ${currentBoxTheme.highlight}`}>
                    {rarityProbabilities[rarity].toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5">
                {itemsByRarity[rarity].map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between bg-gray-800/60 p-1.5 px-2 rounded 
                              border border-gray-700/50"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-shrink">
                      <ItemImage
                        itemId={item.id}
                        size={24}
                      />
                      <span className="text-white text-xs truncate max-w-[100px]">
                        {getItemName(t, item.id)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-300 font-mono ml-1 whitespace-nowrap">
                      {item.percentage.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-gray-400 text-xs mt-4 bg-gray-800/50 p-2 rounded-lg border border-gray-700/70">
          <p>
            Las probabilidades son calculadas basadas en los pesos de cada item dentro de la caja.
          </p>
        </div>
      </div>
    </div>
  );
}