import { Filter, Search } from "lucide-react";
import { getRarityConfig } from "../../_utils/rarityConfig";
import { useTranslations } from "next-intl";
import { getItemRarity } from "@/lib/intlUtils";
import { ArcadeInventoryItem } from "@/generated/api";

interface CollectionFiltersProps {
  selectedRarity: ArcadeInventoryItem.rarity | "all";
  onRarityChange: (rarity: ArcadeInventoryItem.rarity | "all") => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CollectionFilters({ 
  selectedRarity, 
  onRarityChange, 
  searchTerm, 
  onSearchChange 
}: CollectionFiltersProps) {
  const t = useTranslations("");
  
  return (
    <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
      <div className="flex items-center space-x-2 bg-surface-800 rounded-lg p-2 border border-surface-700">
        <Search className="text-surface-400" size={20} />
        <input
          type="text"
          placeholder="Buscar objeto..."
          value={searchTerm}
          onChange={onSearchChange}
          className="bg-transparent border-none text-white focus:outline-none w-full placeholder:text-surface-500"
        />
      </div>
      
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Filter size={16} className="text-surface-400 mr-1" />
        {["all", "common", "uncommon", "rare", "epic", "legendary"].map((rarity) => {
          const isActive = selectedRarity === rarity;
          let styles;
          
          if (rarity === "all") {
            styles = isActive 
              ? "bg-white text-black" 
              : "bg-surface-800 text-surface-300 hover:bg-surface-700";
          } else {
            const config = getRarityConfig(rarity as ArcadeInventoryItem.rarity);
            styles = isActive 
              ? `${config.bgColor} ${config.textColor}` 
              : "bg-surface-800 text-surface-300 hover:bg-surface-700";
          }
          
          return (
            <button
              key={rarity}
              onClick={() => onRarityChange(rarity as ArcadeInventoryItem.rarity | "all")}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${isActive ? 'border-cyan-500/50' : 'border-surface-700'} ${styles}`}
            >
              {getItemRarity(t, rarity as ArcadeInventoryItem.rarity)}
            </button>
          );
        })}
      </div>
    </div>
  );
}